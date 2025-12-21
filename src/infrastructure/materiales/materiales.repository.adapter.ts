import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { IMaterialesRepository } from '@/domain/materiales/ports/materiales.repository.port';
import { MaterialCapacitacion } from '@/entities/materiales/material-capacitacion.entity';
import { CreateMaterialDto } from '@/application/materiales/dto/create-material.dto';
import { UpdateMaterialDto } from '@/application/materiales/dto/update-material.dto';

@Injectable()
export class MaterialesRepositoryAdapter implements IMaterialesRepository {
  constructor(
    @InjectRepository(MaterialCapacitacion)
    private readonly materialRepository: Repository<MaterialCapacitacion>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createMaterialDto: CreateMaterialDto,
  ): Promise<MaterialCapacitacion> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const newMaterial = this.materialRepository.create({
        capacitacion: { id: createMaterialDto.capacitacionId } as any,
        tipoMaterial: { id: createMaterialDto.tipoMaterialId } as any,
        nombre: createMaterialDto.nombre,
        url: createMaterialDto.url,
        descripcion: createMaterialDto.descripcion,
        orden: createMaterialDto.orden ?? 0,
        activo: true,
      });

      const savedMaterial = await queryRunner.manager.save(newMaterial);

      await queryRunner.commitTransaction();

      // Cargar relaciones para retornar objeto completo
      return this.materialRepository.findOne({
        where: { id: savedMaterial.id },
        relations: ['tipoMaterial', 'capacitacion'],
      }) as Promise<MaterialCapacitacion>;
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

  async findByCapacitacion(
    capacitacionId: number,
  ): Promise<MaterialCapacitacion[]> {
    try {
      return await this.materialRepository.find({
        where: { capacitacion: { id: capacitacionId } },
        relations: ['tipoMaterial'],
        order: { orden: 'ASC', fechaCreacion: 'ASC' },
      });
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        'Error al obtener materiales de la capacitación',
      );
    }
  }

  async findOne(id: number): Promise<MaterialCapacitacion | null> {
    try {
      return await this.materialRepository.findOne({
        where: { id },
        relations: ['tipoMaterial', 'capacitacion'],
      });
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Error al obtener el material');
    }
  }

  async update(
    id: number,
    updateMaterialDto: UpdateMaterialDto,
  ): Promise<MaterialCapacitacion> {
    try {
      const material = await this.materialRepository.findOne({
        where: { id },
      });

      if (!material) {
        throw new NotFoundException(`Material con ID ${id} no encontrado`);
      }

      const updatedMaterial = {
        ...material,
        ...updateMaterialDto,
      };

      if (updateMaterialDto.tipoMaterialId) {
        updatedMaterial.tipoMaterial = {
          id: updateMaterialDto.tipoMaterialId,
        } as any;
      }

      if (updateMaterialDto.capacitacionId) {
        updatedMaterial.capacitacion = {
          id: updateMaterialDto.capacitacionId,
        } as any;
      }

      await this.materialRepository.save(updatedMaterial);

      // Retornar material actualizado con relaciones
      return this.materialRepository.findOne({
        where: { id },
        relations: ['tipoMaterial', 'capacitacion'],
      }) as Promise<MaterialCapacitacion>;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(error);
      throw new InternalServerErrorException('Error al actualizar el material');
    }
  }

  async remove(id: number): Promise<void> {
    try {
      const material = await this.materialRepository.findOne({
        where: { id },
      });

      if (!material) {
        throw new NotFoundException(`Material con ID ${id} no encontrado`);
      }

      await this.materialRepository.remove(material);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(error);
      throw new InternalServerErrorException('Error al eliminar el material');
    }
  }
}

