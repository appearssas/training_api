import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository, QueryRunner } from 'typeorm';
import { IEvaluacionesRepository } from '@/domain/evaluaciones/ports/evaluaciones.repository.port';
import { Evaluacion } from '@/entities/evaluaciones/evaluacion.entity';
import { Pregunta } from '@/entities/evaluaciones/pregunta.entity';
import { OpcionRespuesta } from '@/entities/evaluaciones/opcion-respuesta.entity';
import { UpdateEvaluacionDto, UpdatePreguntaDto, UpdateOpcionRespuestaDto } from '@/application/evaluaciones/dto';

/**
 * Adaptador del repositorio de Evaluaciones
 * Implementa IEvaluacionesRepository usando TypeORM
 * Sigue el principio de Inversión de Dependencias (SOLID)
 */
@Injectable()
export class EvaluacionesRepositoryAdapter implements IEvaluacionesRepository {
  constructor(
    @InjectRepository(Evaluacion)
    private readonly evaluacionRepository: Repository<Evaluacion>,
    @InjectRepository(Pregunta)
    private readonly preguntaRepository: Repository<Pregunta>,
    @InjectRepository(OpcionRespuesta)
    private readonly opcionRespuestaRepository: Repository<OpcionRespuesta>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Obtiene una evaluación por ID con sus preguntas y opciones
   */
  async findOne(id: number): Promise<Evaluacion | null> {
    try {
      return await this.evaluacionRepository.findOne({
        where: { id },
        relations: [
          'preguntas',
          'preguntas.tipoPregunta',
          'preguntas.opciones',
          'capacitacion',
        ],
        order: {
          preguntas: {
            orden: 'ASC',
            opciones: {
              orden: 'ASC',
            },
          },
        },
      });
    } catch (error) {
      console.error('Error al obtener evaluación:', error);
      throw new InternalServerErrorException('Error al obtener la evaluación');
    }
  }

  /**
   * Actualiza una evaluación existente
   * Sincroniza preguntas y opciones (crear, actualizar, eliminar)
   * Usa transacciones para garantizar integridad de datos
   */
  async update(
    id: number,
    updateEvaluacionDto: UpdateEvaluacionDto,
  ): Promise<Evaluacion> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // Obtener evaluación existente
      const existingEvaluacion = await this.evaluacionRepository.findOne({
        where: { id },
        relations: ['preguntas', 'preguntas.opciones'],
      });

      if (!existingEvaluacion) {
        throw new NotFoundException(`Evaluación con ID ${id} no encontrada`);
      }

      // Actualizar campos básicos de la evaluación
      if (updateEvaluacionDto.titulo !== undefined) {
        existingEvaluacion.titulo = updateEvaluacionDto.titulo;
      }
      if (updateEvaluacionDto.descripcion !== undefined) {
        existingEvaluacion.descripcion = updateEvaluacionDto.descripcion;
      }
      if (updateEvaluacionDto.tiempoLimiteMinutos !== undefined) {
        existingEvaluacion.tiempoLimiteMinutos = updateEvaluacionDto.tiempoLimiteMinutos;
      }
      if (updateEvaluacionDto.intentosPermitidos !== undefined) {
        existingEvaluacion.intentosPermitidos = updateEvaluacionDto.intentosPermitidos;
      }
      if (updateEvaluacionDto.mostrarResultados !== undefined) {
        existingEvaluacion.mostrarResultados = updateEvaluacionDto.mostrarResultados;
      }
      if (updateEvaluacionDto.mostrarRespuestasCorrectas !== undefined) {
        existingEvaluacion.mostrarRespuestasCorrectas = updateEvaluacionDto.mostrarRespuestasCorrectas;
      }
      // El puntajeTotal se calculará automáticamente después de sincronizar las preguntas
      // No se actualiza manualmente aquí para mantener consistencia
      if (updateEvaluacionDto.minimoAprobacion !== undefined) {
        existingEvaluacion.minimoAprobacion = updateEvaluacionDto.minimoAprobacion;
      }
      if (updateEvaluacionDto.orden !== undefined) {
        existingEvaluacion.orden = updateEvaluacionDto.orden;
      }

      const savedEvaluacion = await queryRunner.manager.save(existingEvaluacion);

      // Sincronizar preguntas si se proporcionan
      if (updateEvaluacionDto.preguntas !== undefined) {
        await this.syncPreguntas(
          queryRunner,
          savedEvaluacion,
          updateEvaluacionDto.preguntas,
          existingEvaluacion.preguntas || [],
        );

        // Recalcular el puntaje total automáticamente después de sincronizar las preguntas
        const updatedPreguntas = await queryRunner.manager.find(Pregunta, {
          where: { evaluacion: { id: savedEvaluacion.id } },
        });

        const puntajeTotalCalculado = updatedPreguntas.reduce(
          (sum, pregunta) => sum + Number(pregunta.puntaje || 0),
          0
        );

        savedEvaluacion.puntajeTotal = puntajeTotalCalculado;
        await queryRunner.manager.save(savedEvaluacion);
      }

      await queryRunner.commitTransaction();

      // Retornar evaluación actualizada con relaciones
      const updatedEvaluacion = await this.findOne(id);
      if (!updatedEvaluacion) {
        throw new InternalServerErrorException('Error al recuperar la evaluación actualizada');
      }

      return updatedEvaluacion;
    } catch (error: unknown) {
      await queryRunner.rollbackTransaction();

      if (error instanceof NotFoundException) {
        throw error;
      }

      if (error instanceof BadRequestException) {
        throw error;
      }

      if (error instanceof QueryFailedError) {
        throw new BadRequestException((error as QueryFailedError).message);
      }

      console.error('Error al actualizar evaluación:', error);
      throw new InternalServerErrorException('Error al actualizar la evaluación');
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Sincroniza preguntas: crea nuevas, actualiza existentes, elimina las que ya no están
   */
  private async syncPreguntas(
    queryRunner: QueryRunner,
    evaluacion: Evaluacion,
    newPreguntas: UpdateEvaluacionDto['preguntas'],
    existingPreguntas: Pregunta[],
  ): Promise<void> {
    if (!newPreguntas) return;

    // Validar que todas las preguntas tengan puntaje válido
    for (const preguntaData of newPreguntas) {
      if (!preguntaData.puntaje || preguntaData.puntaje <= 0) {
        throw new BadRequestException(
          `La pregunta "${preguntaData.enunciado}" debe tener un puntaje mayor a 0`,
        );
      }
    }

    // IDs de preguntas nuevas (las que tienen id son existentes)
    const newPreguntaIds = new Set(
      newPreguntas
        .filter((p) => p.id !== undefined && p.id !== null)
        .map((p) => p.id!),
    );

    // Eliminar preguntas que ya no están en la lista
    const preguntasToDelete = existingPreguntas.filter(
      (p) => !newPreguntaIds.has(p.id),
    );
    for (const pregunta of preguntasToDelete) {
      await queryRunner.manager.remove(pregunta);
    }

    // Crear o actualizar preguntas
    for (let i = 0; i < newPreguntas.length; i++) {
      const preguntaData = newPreguntas[i];
      const preguntaId = preguntaData.id;

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

      let pregunta: Pregunta;

      if (preguntaId) {
        // Actualizar pregunta existente
        const existingPregunta = existingPreguntas.find((p) => p.id === preguntaId);
        if (!existingPregunta) {
          throw new NotFoundException(`Pregunta con ID ${preguntaId} no encontrada`);
        }

        // Actualizar solo los campos que están definidos
        if (preguntaData.enunciado !== undefined) {
          existingPregunta.enunciado = preguntaData.enunciado;
        }
        if (preguntaData.imagenUrl !== undefined) {
          existingPregunta.imagenUrl = preguntaData.imagenUrl || null;
        }
        if (preguntaData.puntaje !== undefined) {
          existingPregunta.puntaje = preguntaData.puntaje;
        }
        if (preguntaData.orden !== undefined) {
          existingPregunta.orden = preguntaData.orden;
        }
        if (preguntaData.requerida !== undefined) {
          existingPregunta.requerida = preguntaData.requerida;
        }
        if (preguntaData.tipoPreguntaId !== undefined) {
          existingPregunta.tipoPregunta = {
            id: preguntaData.tipoPreguntaId,
          } as any;
        }

        pregunta = await queryRunner.manager.save(existingPregunta);

        // Sincronizar opciones de la pregunta
        await this.syncOpciones(
          queryRunner,
          pregunta,
          preguntaData.opciones,
          existingPregunta.opciones || [],
        );
      } else {
        // Crear nueva pregunta - validar campos requeridos
        if (!preguntaData.enunciado) {
          throw new BadRequestException('El enunciado de la pregunta es requerido');
        }
        if (!preguntaData.tipoPreguntaId) {
          throw new BadRequestException('El tipo de pregunta es requerido');
        }

        const newPregunta = this.preguntaRepository.create({
          evaluacion,
          tipoPregunta: { id: preguntaData.tipoPreguntaId } as any,
          enunciado: preguntaData.enunciado,
          imagenUrl: preguntaData.imagenUrl || undefined,
          puntaje: preguntaData.puntaje || 1.0,
          orden: preguntaData.orden ?? i,
          requerida: preguntaData.requerida ?? true,
          activo: true,
        });

        pregunta = await queryRunner.manager.save(newPregunta);

        // Crear opciones de la pregunta
        for (let j = 0; j < preguntaData.opciones.length; j++) {
          const opcionData = preguntaData.opciones[j];

          // Validar campos requeridos
          if (!opcionData.texto) {
            throw new BadRequestException(`El texto de la opción ${j + 1} es requerido`);
          }
          if (opcionData.esCorrecta === undefined) {
            throw new BadRequestException(`El campo esCorrecta de la opción ${j + 1} es requerido`);
          }

          const newOpcion = this.opcionRespuestaRepository.create({
            pregunta,
            texto: opcionData.texto,
            imagenUrl: opcionData.imagenUrl || null,
            esCorrecta: opcionData.esCorrecta,
            puntajeParcial: opcionData.puntajeParcial || 0.0,
            orden: opcionData.orden ?? j,
          });

          await queryRunner.manager.save(newOpcion);
        }
      }
    }
  }

  /**
   * Sincroniza opciones de una pregunta: crea nuevas, actualiza existentes, elimina las que ya no están
   */
  private async syncOpciones(
    queryRunner: QueryRunner,
    pregunta: Pregunta,
    newOpciones: UpdateOpcionRespuestaDto[] | undefined,
    existingOpciones: OpcionRespuesta[],
  ): Promise<void> {
    if (!newOpciones) return;

    // IDs de opciones nuevas (las que tienen id son existentes)
    const newOpcionIds = new Set(
      newOpciones
        .filter((o) => o.id !== undefined && o.id !== null)
        .map((o) => o.id!),
    );

    // Eliminar opciones que ya no están en la lista
    const opcionesToDelete = existingOpciones.filter(
      (o) => !newOpcionIds.has(o.id),
    );
    for (const opcion of opcionesToDelete) {
      await queryRunner.manager.remove(opcion);
    }

    // Crear o actualizar opciones
    for (let j = 0; j < newOpciones.length; j++) {
      const opcionData = newOpciones[j];
      const opcionId = opcionData.id;

      if (opcionId) {
        // Actualizar opción existente
        const existingOpcion = existingOpciones.find((o) => o.id === opcionId);
        if (!existingOpcion) {
          throw new NotFoundException(`Opción con ID ${opcionId} no encontrada`);
        }

        // Actualizar solo los campos que están definidos
        if (opcionData.texto !== undefined) {
          existingOpcion.texto = opcionData.texto;
        }
        if (opcionData.imagenUrl !== undefined) {
          existingOpcion.imagenUrl = opcionData.imagenUrl || null;
        }
        if (opcionData.esCorrecta !== undefined) {
          existingOpcion.esCorrecta = opcionData.esCorrecta;
        }
        if (opcionData.puntajeParcial !== undefined) {
          existingOpcion.puntajeParcial = opcionData.puntajeParcial;
        }
        if (opcionData.orden !== undefined) {
          existingOpcion.orden = opcionData.orden;
        }

        await queryRunner.manager.save(existingOpcion);
      } else {
        // Crear nueva opción - validar campos requeridos
        if (!opcionData.texto) {
          throw new BadRequestException(`El texto de la opción ${j + 1} es requerido`);
        }
        if (opcionData.esCorrecta === undefined) {
          throw new BadRequestException(`El campo esCorrecta de la opción ${j + 1} es requerido`);
        }

        const newOpcion = this.opcionRespuestaRepository.create({
          pregunta,
          texto: opcionData.texto,
          imagenUrl: opcionData.imagenUrl || null,
          esCorrecta: opcionData.esCorrecta,
          puntajeParcial: opcionData.puntajeParcial || 0.0,
          orden: opcionData.orden ?? j,
        });

        await queryRunner.manager.save(newOpcion);
      }
    }
  }
}

