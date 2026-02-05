import { Inscripcion } from '@/entities/inscripcion/inscripcion.entity';
import { CreateInscripcionDto } from '@/application/inscripciones/dto/create-inscripcion.dto';
import { UpdateInscripcionDto } from '@/application/inscripciones/dto/update-inscripcion.dto';
import { PaginationDto } from '@/application/shared/dto/pagination.dto';

/**
 * Puerto para el repositorio de Inscripciones
 * Define el contrato que debe cumplir cualquier implementación del repositorio
 */
export interface IInscripcionesRepository {
  /**
   * Crea una nueva inscripción
   */
  create(createInscripcionDto: CreateInscripcionDto): Promise<Inscripcion>;

  /**
   * Obtiene todas las inscripciones con paginación
   */
  findAll(pagination: PaginationDto): Promise<any>;

  /**
   * Obtiene una inscripción por ID
   */
  findOne(id: number): Promise<Inscripcion | null>;

  /**
   * Actualiza una inscripción existente
   */
  update(id: number, updateInscripcionDto: UpdateInscripcionDto): Promise<Inscripcion>;

  /**
   * Elimina una inscripción
   */
  remove(id: number): Promise<void>;

  /**
   * Obtiene todas las inscripciones de un estudiante específico
   */
  findByEstudiante(estudianteId: number, pagination?: PaginationDto): Promise<any>;

  /**
   * Obtiene todas las inscripciones de una capacitación específica
   */
  findByCapacitacion(capacitacionId: number, pagination?: PaginationDto): Promise<any>;

  /**
   * Verifica si un estudiante ya está inscrito en una capacitación
   */
  existsByEstudianteAndCapacitacion(
    estudianteId: number,
    capacitacionId: number,
  ): Promise<boolean>;

  /**
   * Obtiene todas las inscripciones de un estudiante (sin paginación, para uso admin)
   */
  findAllByEstudiante(estudianteId: number): Promise<Inscripcion[]>;
}
