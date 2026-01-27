import { Resena } from '@/entities/resenas/resena.entity';
import { CreateResenaDto } from '@/application/resenas/dto/create-resena.dto';

/**
 * Puerto para el repositorio de Reseñas
 * Define el contrato que debe cumplir cualquier implementación del repositorio
 */
export interface IResenasRepository {
  /**
   * Crea una nueva reseña
   */
  create(createResenaDto: CreateResenaDto): Promise<Resena>;

  /**
   * Obtiene una reseña por ID
   */
  findOne(id: number): Promise<Resena | null>;

  /**
   * Obtiene una reseña por inscripción
   */
  findByInscripcion(inscripcionId: number): Promise<Resena | null>;

  /**
   * Verifica si ya existe una reseña para una inscripción
   */
  existsByInscripcion(inscripcionId: number): Promise<boolean>;
}
