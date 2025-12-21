import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { ICapacitacionesRepository } from '@/domain/capacitaciones/ports/capacitaciones.repository.port';
import { Capacitacion } from '@/entities/capacitacion/capacitacion.entity';
import { Evaluacion } from '@/entities/evaluaciones/evaluacion.entity';
import { Pregunta } from '@/entities/evaluaciones/pregunta.entity';
import { OpcionRespuesta } from '@/entities/evaluaciones/opcion-respuesta.entity';
import { CreateCapacitacionDto } from '@/application/capacitaciones/dto/create-capacitacion.dto';
import { UpdateCapacitacionDto } from '@/application/capacitaciones/dto/update-capacitacion.dto';
import { PaginationDto } from '@/application/shared/dto/pagination.dto';

@Injectable()
export class CapacitacionesRepositoryAdapter implements ICapacitacionesRepository {
  constructor(
    @InjectRepository(Capacitacion)
    private readonly capacitacionRepository: Repository<Capacitacion>,
    @InjectRepository(Evaluacion)
    private readonly evaluacionRepository: Repository<Evaluacion>,
    @InjectRepository(Pregunta)
    private readonly preguntaRepository: Repository<Pregunta>,
    @InjectRepository(OpcionRespuesta)
    private readonly opcionRespuestaRepository: Repository<OpcionRespuesta>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createCapacitacionDto: CreateCapacitacionDto,
  ): Promise<Capacitacion> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // Extraer datos de evaluación si vienen en el DTO
      const { evaluacion: evaluacionData, ...capacitacionData } = createCapacitacionDto;

      // Crear la capacitación
      const newCapacitacion = this.capacitacionRepository.create({
        ...capacitacionData,
        tipoCapacitacion: {
          id: createCapacitacionDto.tipoCapacitacionId,
        } as any,
        modalidad: { id: createCapacitacionDto.modalidadId } as any,
        instructor: { id: createCapacitacionDto.instructorId } as any,
        usuarioCreacion: createCapacitacionDto.usuarioCreacion || 'system',
      });

      const savedCapacitacion = await queryRunner.manager.save(newCapacitacion);

      // Si viene evaluación en el DTO, crearla en la misma transacción
      if (evaluacionData) {
        // Validar que tenga al menos una pregunta (RF-08)
        if (!evaluacionData.preguntas || evaluacionData.preguntas.length === 0) {
          throw new BadRequestException(
            'La evaluación debe tener al menos una pregunta (RF-08)',
          );
        }

        // Crear la evaluación
        const newEvaluacion = this.evaluacionRepository.create({
          capacitacion: savedCapacitacion,
          titulo: evaluacionData.titulo,
          descripcion: evaluacionData.descripcion || undefined,
          tiempoLimiteMinutos: evaluacionData.tiempoLimiteMinutos || undefined,
          intentosPermitidos: evaluacionData.intentosPermitidos || 1,
          mostrarResultados: evaluacionData.mostrarResultados ?? true,
          mostrarRespuestasCorrectas: evaluacionData.mostrarRespuestasCorrectas ?? false,
          puntajeTotal: evaluacionData.puntajeTotal || 100.0,
          minimoAprobacion: evaluacionData.minimoAprobacion || 70.0,
          orden: evaluacionData.orden || 0,
          activo: true,
        });

        const savedEvaluacion = await queryRunner.manager.save(newEvaluacion);

        // Crear las preguntas y sus opciones
        for (let i = 0; i < evaluacionData.preguntas.length; i++) {
          const preguntaData = evaluacionData.preguntas[i];

          // Validar que tenga al menos una opción
          if (!preguntaData.opciones || preguntaData.opciones.length === 0) {
            throw new BadRequestException(
              `La pregunta "${preguntaData.enunciado}" debe tener al menos una opción de respuesta`,
            );
          }

          // Validar que tenga al menos una opción correcta
          const tieneOpcionCorrecta = preguntaData.opciones.some(
            (opcion) => opcion.esCorrecta,
          );
          if (!tieneOpcionCorrecta) {
            throw new BadRequestException(
              `La pregunta "${preguntaData.enunciado}" debe tener al menos una opción correcta`,
            );
          }

          const newPregunta = this.preguntaRepository.create({
            evaluacion: savedEvaluacion,
            tipoPregunta: { id: preguntaData.tipoPreguntaId } as any,
            enunciado: preguntaData.enunciado,
            imagenUrl: preguntaData.imagenUrl || undefined,
            puntaje: preguntaData.puntaje || 1.0,
            orden: preguntaData.orden ?? i,
            requerida: preguntaData.requerida ?? true,
            activo: true,
          });

          const savedPregunta = await queryRunner.manager.save(newPregunta);

          // Crear las opciones de respuesta
          for (let j = 0; j < preguntaData.opciones.length; j++) {
            const opcionData = preguntaData.opciones[j];

            const newOpcion = this.opcionRespuestaRepository.create({
              pregunta: savedPregunta,
              texto: opcionData.texto,
              esCorrecta: opcionData.esCorrecta,
              puntajeParcial: opcionData.puntajeParcial || 0.0,
              orden: opcionData.orden ?? j,
            });

            await queryRunner.manager.save(newOpcion);
          }
        }
      }

      await queryRunner.commitTransaction();

      // Retornar la capacitación con sus relaciones
      const capacitacionCompleta = await this.findOne(savedCapacitacion.id);
      if (!capacitacionCompleta) {
        throw new InternalServerErrorException(
          'Error al recuperar la capacitación creada',
        );
      }
      return capacitacionCompleta;
    } catch (error: unknown) {
      await queryRunner.rollbackTransaction();

      if (error instanceof BadRequestException) {
        throw error;
      }

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
        relations: [
          'tipoCapacitacion',
          'modalidad',
          'instructor',
          'materiales',
          'materiales.tipoMaterial',
          'secciones',
          'secciones.lecciones',
          'evaluaciones',
          'evaluaciones.preguntas',
        ],
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
