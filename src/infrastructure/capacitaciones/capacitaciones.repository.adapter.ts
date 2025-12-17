import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { ICapacitacionesRepository } from '@/domain/capacitaciones/ports/capacitaciones.repository.port';
import { Capacitacion } from '@/entities/capacitacion.entity';
import { CreateCapacitacionDto } from '@/application/capacitaciones/dto/create-capacitacion.dto';
import { UpdateCapacitacionDto } from '@/application/capacitaciones/dto/update-capacitacion.dto';
import { PaginationDto } from '@/application/shared/dto/pagination.dto';

@Injectable()
export class CapacitacionesRepositoryAdapter implements ICapacitacionesRepository {
  constructor(
    @InjectRepository(Capacitacion)
    private readonly capacitacionRepository: Repository<Capacitacion>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createCapacitacionDto: CreateCapacitacionDto,
  ): Promise<Capacitacion> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const newCapacitacion = this.capacitacionRepository.create({
        ...createCapacitacionDto,
        tipoCapacitacion: {
          id: createCapacitacionDto.tipoCapacitacionId,
        } as any,
        modalidad: { id: createCapacitacionDto.modalidadId } as any,
        instructor: { id: createCapacitacionDto.instructorId } as any,
      });

      const savedCapacitacion = await queryRunner.manager.save(newCapacitacion);

      await queryRunner.commitTransaction();

      return savedCapacitacion;
    } catch (error: unknown) {
      await queryRunner.rollbackTransaction();

      if (error instanceof QueryFailedError) {
        throw new BadRequestException((error as QueryFailedError).message);
      }

      throw new BadRequestException(error);
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(pagination: PaginationDto): Promise<any> {
    try {
      const { page = 1, limit = 10, search, sortField, sortOrder } = pagination;
      const skip = (page - 1) * limit;

      const queryBuilder =
        this.capacitacionRepository.createQueryBuilder('capacitacion');

      if (search) {
        queryBuilder.where(
          'capacitacion.titulo LIKE :search OR capacitacion.descripcion LIKE :search',
          { search: `%${search}%` },
        );
      }

      if (sortField) {
        queryBuilder.orderBy(`capacitacion.${sortField}`, sortOrder || 'ASC');
      } else {
        queryBuilder.orderBy('capacitacion.fechaCreacion', 'DESC');
      }

      queryBuilder.skip(skip).take(limit);

      const [data, total] = await queryBuilder.getManyAndCount();

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error: unknown) {
      console.error(error);
      throw new BadRequestException('Error fetching capacitaciones');
    }
  }

  async findOne(id: number): Promise<Capacitacion | null> {
    try {
      return await this.capacitacionRepository.findOne({
        where: { id },
        relations: ['tipoCapacitacion', 'modalidad', 'instructor'],
      });
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Error fetching capacitacion');
    }
  }

  async update(
    id: number,
    updateCapacitacionDto: UpdateCapacitacionDto,
  ): Promise<Capacitacion> {
    try {
      const capacitacion = await this.capacitacionRepository.findOne({
        where: { id },
      });

      if (!capacitacion) {
        throw new NotFoundException(`Capacitación con ID ${id} no encontrada`);
      }

      const updatedCapacitacion = {
        ...capacitacion,
        ...updateCapacitacionDto,
      };

      if (
        'tipoCapacitacionId' in updateCapacitacionDto &&
        updateCapacitacionDto.tipoCapacitacionId
      ) {
        updatedCapacitacion.tipoCapacitacion = {
          id: updateCapacitacionDto.tipoCapacitacionId,
        } as any;
      }

      if (
        'modalidadId' in updateCapacitacionDto &&
        updateCapacitacionDto.modalidadId
      ) {
        updatedCapacitacion.modalidad = {
          id: updateCapacitacionDto.modalidadId,
        } as any;
      }

      if (
        'instructorId' in updateCapacitacionDto &&
        updateCapacitacionDto.instructorId
      ) {
        updatedCapacitacion.instructor = {
          id: updateCapacitacionDto.instructorId,
        } as any;
      }

      return this.capacitacionRepository.save(updatedCapacitacion);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(error);
      throw new InternalServerErrorException('Error updating capacitacion');
    }
  }

  async remove(id: number): Promise<void> {
    try {
      const capacitacion = await this.capacitacionRepository.findOne({
        where: { id },
      });

      if (!capacitacion) {
        throw new NotFoundException(`Capacitación con ID ${id} no encontrada`);
      }

      await this.capacitacionRepository.remove(capacitacion);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(error);
      throw new InternalServerErrorException('Error deleting capacitacion');
    }
  }
}
