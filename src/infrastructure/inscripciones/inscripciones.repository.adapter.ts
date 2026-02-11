import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { IInscripcionesRepository } from '@/domain/inscripciones/ports/inscripciones.repository.port';
import { Inscripcion } from '@/entities/inscripcion/inscripcion.entity';
import { CreateInscripcionDto } from '@/application/inscripciones/dto/create-inscripcion.dto';
import { UpdateInscripcionDto } from '@/application/inscripciones/dto/update-inscripcion.dto';
import { PaginationDto } from '@/application/shared/dto/pagination.dto';

/**
 * Adaptador del repositorio de Inscripciones
 * Implementa IInscripcionesRepository usando TypeORM
 */
@Injectable()
export class InscripcionesRepositoryAdapter implements IInscripcionesRepository {
  constructor(
    @InjectRepository(Inscripcion)
    private readonly inscripcionRepository: Repository<Inscripcion>,
  ) {}

  async create(
    createInscripcionDto: CreateInscripcionDto,
  ): Promise<Inscripcion> {
    try {
      const inscripcionData: any = {
        capacitacion: { id: createInscripcionDto.capacitacionId } as any,
        estudiante: { id: createInscripcionDto.estudianteId } as any,
        progresoPorcentaje: 0.0,
        estado: 'inscrito' as any,
      };

      if (createInscripcionDto.pagoId) {
        inscripcionData.pago = { id: createInscripcionDto.pagoId } as any;
      }

      if (createInscripcionDto.fechaInicio) {
        inscripcionData.fechaInicio = new Date(
          createInscripcionDto.fechaInicio,
        );
      }

      const newInscripcion = this.inscripcionRepository.create(inscripcionData);
      const savedInscripcion =
        await this.inscripcionRepository.save(newInscripcion);

      // Retornar la inscripción con sus relaciones
      const inscripcionId = Array.isArray(savedInscripcion)
        ? savedInscripcion[0].id
        : (savedInscripcion as Inscripcion).id;

      const inscripcionCompleta = await this.findOne(inscripcionId);
      if (!inscripcionCompleta) {
        throw new InternalServerErrorException(
          'Error al recuperar la inscripción creada',
        );
      }
      return inscripcionCompleta;
    } catch (error: unknown) {
      if (error instanceof QueryFailedError) {
        const errorMessage = (error as QueryFailedError).message;
        if (errorMessage.includes('Duplicate entry')) {
          throw new BadRequestException(
            'Ya existe una inscripción para este estudiante en esta capacitación',
          );
        }
        throw new BadRequestException(errorMessage);
      }
      console.error('Error creating inscripcion:', error);
      throw new InternalServerErrorException('Error al crear la inscripción');
    }
  }

  async findAll(
    pagination: PaginationDto,
    options?: { empresaId?: number },
  ): Promise<any> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        sortField,
        sortOrder,
        filters,
      } = pagination;
      const skip = (page - 1) * limit;

      const queryBuilder = this.inscripcionRepository
        .createQueryBuilder('inscripcion')
        .leftJoinAndSelect('inscripcion.capacitacion', 'capacitacion')
        .leftJoinAndSelect('inscripcion.estudiante', 'estudiante')
        .leftJoinAndSelect('inscripcion.pago', 'pago');

      // Cliente institucional / operador: solo inscripciones de su empresa
      let hasWhere = false;
      if (options?.empresaId != null) {
        queryBuilder.where('estudiante.empresa_id = :empresaId', {
          empresaId: options.empresaId,
        });
        hasWhere = true;
      }

      // Búsqueda por texto
      if (search) {
        const searchCondition =
          '(capacitacion.titulo LIKE :search OR estudiante.nombres LIKE :search OR estudiante.apellidos LIKE :search)';
        if (hasWhere) {
          queryBuilder.andWhere(searchCondition, { search: `%${search}%` });
        } else {
          queryBuilder.where(searchCondition, { search: `%${search}%` });
        }
      }

      // Filtros adicionales
      if (filters) {
        if (filters.estado) {
          queryBuilder.andWhere('inscripcion.estado = :estado', {
            estado: filters.estado,
          });
        }
        if (filters.capacitacionId) {
          queryBuilder.andWhere(
            'inscripcion.capacitacion_id = :capacitacionId',
            {
              capacitacionId: filters.capacitacionId,
            },
          );
        }
        if (filters.estudianteId) {
          queryBuilder.andWhere('inscripcion.estudiante_id = :estudianteId', {
            estudianteId: filters.estudianteId,
          });
        }
      }

      // Ordenamiento
      if (sortField) {
        const orderByField = `inscripcion.${sortField}`;
        queryBuilder.orderBy(orderByField, sortOrder || 'ASC');
      } else {
        queryBuilder.orderBy('inscripcion.fechaInscripcion', 'DESC');
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
      console.error('Error fetching inscripciones:', error);
      throw new InternalServerErrorException(
        'Error al obtener las inscripciones',
      );
    }
  }

  async findOne(id: number): Promise<Inscripcion | null> {
    try {
      return await this.inscripcionRepository.findOne({
        where: { id },
        relations: [
          'capacitacion',
          'capacitacion.tipoCapacitacion',
          'capacitacion.modalidad',
          'capacitacion.instructor',
          'estudiante',
          'pago',
        ],
      });
    } catch (error: unknown) {
      console.error('Error fetching inscripcion:', error);
      throw new InternalServerErrorException('Error al obtener la inscripción');
    }
  }

  async update(
    id: number,
    updateInscripcionDto: UpdateInscripcionDto,
  ): Promise<Inscripcion> {
    try {
      const inscripcion = await this.inscripcionRepository.findOne({
        where: { id },
      });

      if (!inscripcion) {
        throw new NotFoundException(`Inscripción con ID ${id} no encontrada`);
      }

      // Actualizar campos
      if (updateInscripcionDto.estado !== undefined) {
        inscripcion.estado = updateInscripcionDto.estado as any;
      }

      if (updateInscripcionDto.progresoPorcentaje !== undefined) {
        inscripcion.progresoPorcentaje = Number(
          updateInscripcionDto.progresoPorcentaje,
        );
      }

      if (updateInscripcionDto.fechaInicio !== undefined) {
        inscripcion.fechaInicio = new Date(updateInscripcionDto.fechaInicio);
      }

      if (updateInscripcionDto.fechaFinalizacion !== undefined) {
        inscripcion.fechaFinalizacion = new Date(
          updateInscripcionDto.fechaFinalizacion,
        );
      }

      if (updateInscripcionDto.calificacionFinal !== undefined) {
        inscripcion.calificacionFinal = Number(
          updateInscripcionDto.calificacionFinal,
        );
      }

      if (updateInscripcionDto.aprobado !== undefined) {
        inscripcion.aprobado = updateInscripcionDto.aprobado;
      }

      const updatedInscripcion =
        await this.inscripcionRepository.save(inscripcion);

      // Retornar la inscripción actualizada con sus relaciones
      return this.findOne(updatedInscripcion.id) as Promise<Inscripcion>;
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error updating inscripcion:', error);
      throw new InternalServerErrorException(
        'Error al actualizar la inscripción',
      );
    }
  }

  async remove(id: number): Promise<void> {
    try {
      const inscripcion = await this.inscripcionRepository.findOne({
        where: { id },
      });

      if (!inscripcion) {
        throw new NotFoundException(`Inscripción con ID ${id} no encontrada`);
      }

      await this.inscripcionRepository.remove(inscripcion);
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error deleting inscripcion:', error);
      throw new InternalServerErrorException(
        'Error al eliminar la inscripción',
      );
    }
  }

  async findByEstudiante(
    estudianteId: number,
    pagination?: PaginationDto,
  ): Promise<any> {
    try {
      const { page = 1, limit = 10, sortField, sortOrder } = pagination || {};
      const skip = (page - 1) * limit;

      const queryBuilder = this.inscripcionRepository
        .createQueryBuilder('inscripcion')
        .leftJoinAndSelect('inscripcion.estudiante', 'estudiante')
        .leftJoinAndSelect('inscripcion.capacitacion', 'capacitacion')
        .leftJoinAndSelect('capacitacion.tipoCapacitacion', 'tipoCapacitacion')
        .leftJoinAndSelect('capacitacion.modalidad', 'modalidad')
        .leftJoinAndSelect('capacitacion.instructor', 'instructor')
        .leftJoinAndSelect('capacitacion.evaluaciones', 'evaluaciones')
        .leftJoinAndSelect(
          'inscripcion.intentosEvaluacion',
          'intentosEvaluacion',
        )
        .leftJoinAndSelect('intentosEvaluacion.evaluacion', 'intentoEvaluacion')
        .where('inscripcion.estudiante_id = :estudianteId', { estudianteId });

      // Ordenamiento
      if (sortField) {
        const orderByField = `inscripcion.${sortField}`;
        queryBuilder.orderBy(orderByField, sortOrder || 'ASC');
      } else {
        queryBuilder.orderBy('inscripcion.fechaInscripcion', 'DESC');
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
      console.error('Error fetching inscripciones by estudiante:', error);
      throw new InternalServerErrorException(
        'Error al obtener las inscripciones del estudiante',
      );
    }
  }

  async findAllByEstudiante(estudianteId: number): Promise<Inscripcion[]> {
    try {
      return await this.inscripcionRepository.find({
        where: { estudiante: { id: estudianteId } },
        relations: [
          'estudiante',
          'capacitacion',
          'capacitacion.tipoCapacitacion',
          'capacitacion.modalidad',
          'pago',
        ],
        order: { fechaInscripcion: 'DESC' },
      });
    } catch (error: unknown) {
      console.error('Error fetching all inscripciones by estudiante:', error);
      throw new InternalServerErrorException(
        'Error al obtener las inscripciones del estudiante',
      );
    }
  }

  async findByCapacitacion(
    capacitacionId: number,
    pagination?: PaginationDto,
    options?: { empresaId?: number },
  ): Promise<any> {
    try {
      const { page = 1, limit = 10, sortField, sortOrder } = pagination || {};
      const skip = (page - 1) * limit;

      const queryBuilder = this.inscripcionRepository
        .createQueryBuilder('inscripcion')
        .leftJoinAndSelect('inscripcion.estudiante', 'estudiante')
        .leftJoinAndSelect('inscripcion.pago', 'pago')
        .where('inscripcion.capacitacion_id = :capacitacionId', {
          capacitacionId,
        });

      // CLIENTE/OPERADOR: solo inscripciones de estudiantes de su empresa
      if (options?.empresaId != null) {
        queryBuilder.andWhere('estudiante.empresa_id = :empresaId', {
          empresaId: options.empresaId,
        });
      }

      // Ordenamiento
      if (sortField) {
        const orderByField = `inscripcion.${sortField}`;
        queryBuilder.orderBy(orderByField, sortOrder || 'ASC');
      } else {
        queryBuilder.orderBy('inscripcion.fechaInscripcion', 'DESC');
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
      console.error('Error fetching inscripciones by capacitacion:', error);
      throw new InternalServerErrorException(
        'Error al obtener las inscripciones de la capacitación',
      );
    }
  }

  async existsByEstudianteAndCapacitacion(
    estudianteId: number,
    capacitacionId: number,
  ): Promise<boolean> {
    try {
      const count = await this.inscripcionRepository.count({
        where: {
          estudiante: { id: estudianteId } as any,
          capacitacion: { id: capacitacionId } as any,
        },
      });
      return count > 0;
    } catch (error: unknown) {
      console.error('Error checking existing inscripcion:', error);
      throw new InternalServerErrorException(
        'Error al verificar inscripción existente',
      );
    }
  }
}
