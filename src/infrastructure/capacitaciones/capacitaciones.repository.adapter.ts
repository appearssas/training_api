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
import { appendFileSync } from 'fs';
import { join } from 'path';

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
      const { evaluacion: evaluacionData, ...capacitacionData } =
        createCapacitacionDto;

      // Crear la capacitación
      const newCapacitacion = this.capacitacionRepository.create({
        ...capacitacionData,
        tipoCapacitacion: {
          id: createCapacitacionDto.tipoCapacitacionId,
        } as any,
        modalidad: { id: createCapacitacionDto.modalidadId } as any,
        instructor: { id: createCapacitacionDto.instructorId } as any,
        enteCertificador:
          createCapacitacionDto.enteCertificadorId != null
            ? { id: createCapacitacionDto.enteCertificadorId } as any
            : undefined,
        usuarioCreacion: createCapacitacionDto.usuarioCreacion || 'system',
      });

      const savedCapacitacion = await queryRunner.manager.save(newCapacitacion);

      // Si viene evaluación en el DTO, crearla en la misma transacción
      if (evaluacionData) {
        // Validar que tenga al menos una pregunta (RF-08)
        if (
          !evaluacionData.preguntas ||
          evaluacionData.preguntas.length === 0
        ) {
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
          mostrarRespuestasCorrectas:
            evaluacionData.mostrarRespuestasCorrectas ?? false,
          puntajeTotal: evaluacionData.puntajeTotal || 100.0,
          minimoAprobacion: evaluacionData.minimoAprobacion || 70.0,
          orden: evaluacionData.orden || 0,
          activo: true,
        });

        const savedEvaluacion = await queryRunner.manager.save(newEvaluacion);

        // Validar que todas las preguntas tengan puntaje válido
        for (const preguntaData of evaluacionData.preguntas) {
          if (!preguntaData.puntaje || preguntaData.puntaje <= 0) {
            throw new BadRequestException(
              `La pregunta "${preguntaData.enunciado}" debe tener un puntaje mayor a 0`,
            );
          }
        }

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
            opcion => opcion.esCorrecta,
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
              imagenUrl: opcionData.imagenUrl || null,
              esCorrecta: opcionData.esCorrecta,
              puntajeParcial: opcionData.puntajeParcial || 0.0,
              orden: opcionData.orden ?? j,
            });

            await queryRunner.manager.save(newOpcion);
          }
        }

        // Calcular el puntaje total automáticamente como la suma de los puntajes de todas las preguntas
        // Primero obtener las preguntas guardadas para usar sus puntajes reales
        const preguntasGuardadas = await queryRunner.manager.find(Pregunta, {
          where: { evaluacion: { id: savedEvaluacion.id } },
        });

        const puntajeTotalCalculado = preguntasGuardadas.reduce(
          (sum, pregunta) => sum + Number(pregunta.puntaje || 0),
          0,
        );

        // Actualizar el puntajeTotal de la evaluación con el valor calculado
        // Si el cálculo es 0, mantener el valor por defecto o el enviado
        if (puntajeTotalCalculado > 0) {
          savedEvaluacion.puntajeTotal = puntajeTotalCalculado;
          await queryRunner.manager.save(savedEvaluacion);
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

  async findAll(
    pagination: PaginationDto,
    options?: { empresaId?: number },
  ): Promise<any> {
    try {
      const { page = 1, limit = 10, search, sortField, sortOrder } = pagination;
      const skip = (page - 1) * limit;

      const queryBuilder =
        this.capacitacionRepository.createQueryBuilder('capacitacion');

      // Cliente institucional / operador: solo cursos asignados a su empresa por el admin (el cliente luego los asigna a sus usuarios)
      let hasWhere = false;
      if (options?.empresaId != null) {
        queryBuilder.where(
          'capacitacion.id IN (SELECT ce.capacitacion_id FROM capacitaciones_empresas ce WHERE ce.empresa_id = :empresaId)',
          { empresaId: options.empresaId },
        );
        hasWhere = true;
      }

      // Incluir relaciones necesarias para el frontend
      queryBuilder
        .leftJoinAndSelect('capacitacion.tipoCapacitacion', 'tipoCapacitacion')
        .leftJoinAndSelect('capacitacion.modalidad', 'modalidad')
        .leftJoinAndSelect('capacitacion.instructor', 'instructor')
        .leftJoinAndSelect('capacitacion.enteCertificador', 'enteCertificador')
        .leftJoinAndSelect('capacitacion.evaluaciones', 'evaluaciones')
        .leftJoinAndSelect('capacitacion.inscripciones', 'inscripciones')
        .leftJoinAndSelect('inscripciones.resenas', 'resenas')
        .leftJoinAndSelect('inscripciones.estudiante', 'estudiante');

      if (search) {
        const searchCondition =
          '(capacitacion.titulo LIKE :search OR capacitacion.descripcion LIKE :search)';
        if (hasWhere) {
          queryBuilder.andWhere(searchCondition, { search: `%${search}%` });
        } else {
          queryBuilder.where(searchCondition, { search: `%${search}%` });
        }
      }

      if (sortField) {
        queryBuilder.orderBy(`capacitacion.${sortField}`, sortOrder || 'ASC');
      } else {
        queryBuilder.orderBy('capacitacion.fechaCreacion', 'DESC');
      }

      queryBuilder.skip(skip).take(limit);

      const [data, total] = await queryBuilder.getManyAndCount();

      // Calcular promedio de calificaciones y mapear reseñas para cada capacitación
      const dataWithRatings = data.map(capacitacion => {
        if (capacitacion.inscripciones) {
          // Mapear reseñas manteniendo referencia a su inscripción para acceder al estudiante
          const todasLasResenas = capacitacion.inscripciones.flatMap(
            inscripcion =>
              (inscripcion.resenas || [])
                .filter(resena => resena.activo !== false)
                .map(resena => ({
                  resena,
                  inscripcion, // Mantener referencia a la inscripción para acceder al estudiante
                })),
          );

          if (todasLasResenas.length > 0) {
            const sumaCalificaciones = todasLasResenas.reduce(
              (suma, item) => suma + item.resena.calificacion,
              0,
            );
            (capacitacion as any).promedioCalificacion = Number(
              (sumaCalificaciones / todasLasResenas.length).toFixed(2),
            );

            // Agregar todas las reseñas a la capacitación para facilitar el acceso
            (capacitacion as any).resenas = todasLasResenas.map(item => ({
              id: item.resena.id,
              alumnoId: item.inscripcion?.estudiante?.id || null,
              calificacion: item.resena.calificacion,
              comentario: item.resena.comentario || null,
              fechaCreacion: item.resena.fechaCreacion
                ? typeof item.resena.fechaCreacion === 'string'
                  ? item.resena.fechaCreacion
                  : new Date(item.resena.fechaCreacion).toISOString()
                : new Date().toISOString(),
            }));
          } else {
            (capacitacion as any).promedioCalificacion = 0;
            (capacitacion as any).resenas = [];
          }
        } else {
          (capacitacion as any).promedioCalificacion = 0;
          (capacitacion as any).resenas = [];
        }
        return capacitacion;
      });

      return {
        data: dataWithRatings,
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
    // #region agent log
    try {
      appendFileSync(
        join(process.cwd(), '.cursor', 'debug.log'),
        JSON.stringify({
          location: 'capacitaciones.repository.adapter.ts:199',
          message: 'findOne entry',
          data: { id },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'B',
        }) + '\n',
      );
    } catch (e) {
      // Ignorar errores de logging
      void e;
    }
    // #endregion
    try {
      // #region agent log
      try {
        appendFileSync(
          join(process.cwd(), '.cursor', 'debug.log'),
          JSON.stringify({
            location: 'capacitaciones.repository.adapter.ts:201',
            message: 'before repository.findOne',
            data: { id },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'B',
          }) + '\n',
        );
      } catch (e) {
        // Ignorar errores de logging
        void e;
      }
      // #endregion
      const result = await this.capacitacionRepository.findOne({
        where: { id },
        relations: [
          'tipoCapacitacion',
          'modalidad',
          'instructor',
          'enteCertificador',
          'materiales',
          'materiales.tipoMaterial',
          'secciones',
          'secciones.lecciones',
          'evaluaciones',
          'evaluaciones.preguntas',
          'evaluaciones.preguntas.tipoPregunta',
          'evaluaciones.preguntas.opciones',
          'inscripciones',
          'inscripciones.resenas',
          'inscripciones.estudiante',
        ],
      });

      // Ordenar manualmente las relaciones después de cargar
      if (result?.evaluaciones) {
        result.evaluaciones.sort((a, b) => (a.orden || 0) - (b.orden || 0));
        result.evaluaciones.forEach(evaluacion => {
          if (evaluacion.preguntas) {
            evaluacion.preguntas.sort(
              (a, b) => (a.orden || 0) - (b.orden || 0),
            );
            evaluacion.preguntas.forEach(pregunta => {
              if (pregunta.opciones) {
                pregunta.opciones.sort(
                  (a, b) => (a.orden || 0) - (b.orden || 0),
                );
              }
            });
          }
        });
      }
      // #region agent log
      try {
        appendFileSync(
          join(process.cwd(), '.cursor', 'debug.log'),
          JSON.stringify({
            location: 'capacitaciones.repository.adapter.ts:214',
            message: 'repository.findOne success',
            data: {
              id,
              found: !!result,
              hasId: result?.id !== undefined,
              hasRelations: result
                ? {
                    tipoCapacitacion: !!result.tipoCapacitacion,
                    modalidad: !!result.modalidad,
                    instructor: !!result.instructor,
                    materiales: result.materiales?.length || 0,
                    secciones: result.secciones?.length || 0,
                    evaluaciones: result.evaluaciones?.length || 0,
                  }
                : null,
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'B',
          }) + '\n',
        );
      } catch (e) {
        // Ignorar errores de logging
        void e;
      }
      // #endregion
      return result;
    } catch (error: unknown) {
      // #region agent log
      try {
        const err = error as Record<string, unknown>;
        const errorData: Record<string, unknown> = {
          id,
          errorName: err?.constructor?.name,
          errorMessage: error instanceof Error ? error.message : String(error),
          isQueryFailed: error instanceof QueryFailedError,
        };
        if (error instanceof QueryFailedError) {
          errorData.query = error.query;
          errorData.parameters = error.parameters;
          errorData.driverError =
            error.driverError?.message || error.driverError;
          errorData.code = error.driverError?.code;
          errorData.sqlState = error.driverError?.sqlState;
          errorData.sqlMessage = error.driverError?.sqlMessage;
        }
        if (error instanceof Error && error.stack) {
          errorData.stack = error.stack.split('\n').slice(0, 5).join('\n');
        }
        appendFileSync(
          join(process.cwd(), '.cursor', 'debug.log'),
          JSON.stringify({
            location: 'capacitaciones.repository.adapter.ts:227',
            message: 'repository.findOne error',
            data: errorData,
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'B',
          }) + '\n',
        );
      } catch (e) {
        // Ignorar errores de logging
        void e;
      }
      // #endregion
      console.error('Error fetching capacitacion:', error);
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
        relations: ['tipoCapacitacion', 'modalidad', 'instructor', 'enteCertificador'],
      });

      if (!capacitacion) {
        throw new NotFoundException(`Capacitación con ID ${id} no encontrada`);
      }

      // Actualizar solo los campos que vienen en el DTO (no undefined)
      if (updateCapacitacionDto.titulo !== undefined) {
        capacitacion.titulo = updateCapacitacionDto.titulo;
      }
      if (updateCapacitacionDto.descripcion !== undefined) {
        capacitacion.descripcion = updateCapacitacionDto.descripcion;
      }
      if (updateCapacitacionDto.publicoObjetivo !== undefined) {
        capacitacion.publicoObjetivo = updateCapacitacionDto.publicoObjetivo;
      }
      if (updateCapacitacionDto.fechaInicio !== undefined) {
        capacitacion.fechaInicio = updateCapacitacionDto.fechaInicio
          ? new Date(updateCapacitacionDto.fechaInicio)
          : (null as any);
      }
      if (updateCapacitacionDto.fechaFin !== undefined) {
        capacitacion.fechaFin = updateCapacitacionDto.fechaFin
          ? new Date(updateCapacitacionDto.fechaFin)
          : (null as any);
      }
      if (updateCapacitacionDto.duracionHoras !== undefined) {
        capacitacion.duracionHoras = updateCapacitacionDto.duracionHoras;
      }
      if (updateCapacitacionDto.capacidadMaxima !== undefined) {
        capacitacion.capacidadMaxima = updateCapacitacionDto.capacidadMaxima;
      }
      if (updateCapacitacionDto.imagenPortadaUrl !== undefined) {
        capacitacion.imagenPortadaUrl = updateCapacitacionDto.imagenPortadaUrl;
      }
      if (updateCapacitacionDto.videoPromocionalUrl !== undefined) {
        capacitacion.videoPromocionalUrl =
          updateCapacitacionDto.videoPromocionalUrl;
      }
      if (updateCapacitacionDto.minimoAprobacion !== undefined) {
        capacitacion.minimoAprobacion = updateCapacitacionDto.minimoAprobacion;
      }
      if (updateCapacitacionDto.estado !== undefined) {
        capacitacion.estado = updateCapacitacionDto.estado;
      }

      // Actualizar relaciones solo si vienen en el DTO y no son null/undefined
      if (
        updateCapacitacionDto.tipoCapacitacionId !== undefined &&
        updateCapacitacionDto.tipoCapacitacionId !== null
      ) {
        capacitacion.tipoCapacitacion = {
          id: updateCapacitacionDto.tipoCapacitacionId,
        } as any;
      }

      if (
        updateCapacitacionDto.modalidadId !== undefined &&
        updateCapacitacionDto.modalidadId !== null
      ) {
        capacitacion.modalidad = {
          id: updateCapacitacionDto.modalidadId,
        } as any;
      }

      if (
        updateCapacitacionDto.instructorId !== undefined &&
        updateCapacitacionDto.instructorId !== null
      ) {
        capacitacion.instructor = {
          id: updateCapacitacionDto.instructorId,
        } as any;
      }

      if (updateCapacitacionDto.enteCertificadorId !== undefined) {
        capacitacion.enteCertificador =
          updateCapacitacionDto.enteCertificadorId != null
            ? ({ id: updateCapacitacionDto.enteCertificadorId } as any)
            : null;
      }

      if (
        updateCapacitacionDto.areaId !== undefined &&
        updateCapacitacionDto.areaId !== null
      ) {
        capacitacion.areaId = updateCapacitacionDto.areaId;
      }

      const savedCapacitacion =
        await this.capacitacionRepository.save(capacitacion);

      // Retornar la capacitación completa con relaciones
      const capacitacionCompleta = await this.findOne(savedCapacitacion.id);
      if (!capacitacionCompleta) {
        throw new InternalServerErrorException(
          'Error al recuperar la capacitación actualizada',
        );
      }
      return capacitacionCompleta;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof QueryFailedError) {
        const errorMessage = (error as QueryFailedError).message;
        console.error('QueryFailedError updating capacitacion:', {
          message: errorMessage,
          error: error,
        });
        throw new BadRequestException(
          `Error de base de datos: ${errorMessage}`,
        );
      }
      console.error('Error updating capacitacion:', {
        error,
        message: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined,
        updateDto: JSON.stringify(updateCapacitacionDto, null, 2),
      });
      throw new InternalServerErrorException(
        `Error updating capacitacion: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );
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

  async existsByTitulo(titulo: string): Promise<boolean> {
    try {
      const count = await this.capacitacionRepository.count({
        where: { titulo },
      });
      return count > 0;
    } catch (error) {
      console.error('Error checking duplicate titulo:', error);
      throw new InternalServerErrorException(
        'Error al verificar duplicados de capacitación',
      );
    }
  }
}
