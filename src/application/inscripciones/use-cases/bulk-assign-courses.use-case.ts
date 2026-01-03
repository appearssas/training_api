import { Injectable, Inject } from '@nestjs/common';
import { IInscripcionesRepository } from '@/domain/inscripciones/ports/inscripciones.repository.port';
import { BulkAssignCoursesDto } from '@/application/inscripciones/dto/bulk-assign-courses.dto';
import { InscripcionValidatorService } from '@/infrastructure/shared/services/inscripcion-validator.service';
import { CreateInscripcionDto } from '@/application/inscripciones/dto/create-inscripcion.dto';
import { Inscripcion } from '@/entities/inscripcion/inscripcion.entity';

interface BulkAssignResult {
  success: number;
  failed: number;
  total: number;
  details: {
    created: Array<{ userId: number; courseId: number; inscripcionId: number }>;
    skipped: Array<{ userId: number; courseId: number; reason: string }>;
    errors: Array<{ userId: number; courseId: number; error: string }>;
  };
}

/**
 * Caso de uso: Asignación masiva de cursos a usuarios
 * 
 * Permite asignar múltiples cursos a múltiples usuarios en una sola operación.
 * Valida cada combinación usuario-curso antes de crear la inscripción.
 * Omite duplicados y registra errores para cada fallo.
 */
@Injectable()
export class BulkAssignCoursesUseCase {
  constructor(
    @Inject('IInscripcionesRepository')
    private readonly inscripcionesRepository: IInscripcionesRepository,
    private readonly inscripcionValidator: InscripcionValidatorService,
  ) {}

  async execute(bulkAssignDto: BulkAssignCoursesDto): Promise<BulkAssignResult> {
    const { userIds, courseIds } = bulkAssignDto;
    const result: BulkAssignResult = {
      success: 0,
      failed: 0,
      total: userIds.length * courseIds.length,
      details: {
        created: [],
        skipped: [],
        errors: [],
      },
    };

    // Procesar cada combinación usuario-curso
    for (const userId of userIds) {
      for (const courseId of courseIds) {
        try {
          // 1. Validar que la capacitación esté disponible
          await this.inscripcionValidator.validateCapacitacionDisponible(courseId);

          // 2. Validar que el estudiante existe y está activo
          await this.inscripcionValidator.validateEstudiante(userId);

          // 3. Validar que no exista una inscripción duplicada
          const existeInscripcion =
            await this.inscripcionesRepository.existsByEstudianteAndCapacitacion(
              userId,
              courseId,
            );

          if (existeInscripcion) {
            result.details.skipped.push({
              userId,
              courseId,
              reason: 'El usuario ya está inscrito en este curso',
            });
            continue;
          }

          // 4. Validar capacidad máxima (si está definida)
          // Nota: Para asignación masiva, validamos pero no bloqueamos si se excede
          // ya que podría ser intencional asignar más estudiantes
          try {
            await this.inscripcionValidator.validateCapacidadMaxima(courseId);
          } catch (error) {
            // Si hay error de capacidad, lo registramos pero continuamos
            // El administrador puede decidir si quiere asignar de todas formas
            result.details.skipped.push({
              userId,
              courseId,
              reason: error instanceof Error ? error.message : 'Capacidad máxima excedida',
            });
            continue;
          }

          // 5. Crear la inscripción
          const createDto: CreateInscripcionDto = {
            estudianteId: userId,
            capacitacionId: courseId,
          };

          const inscripcion = await this.inscripcionesRepository.create(createDto);
          result.details.created.push({
            userId,
            courseId,
            inscripcionId: inscripcion.id,
          });
          result.success++;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Error desconocido al crear inscripción';
          result.details.errors.push({
            userId,
            courseId,
            error: errorMessage,
          });
          result.failed++;
        }
      }
    }

    return result;
  }
}

