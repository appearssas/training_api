import { Capacitacion } from '@/entities/capacitacion/capacitacion.entity';
import { CreateCapacitacionDto } from '@/application/capacitaciones/dto/create-capacitacion.dto';
import { UpdateCapacitacionDto } from '@/application/capacitaciones/dto/update-capacitacion.dto';
import { PaginationDto } from '@/application/shared/dto/pagination.dto';

/**
 * Puerto para el repositorio de Capacitaciones
 */
export interface ICapacitacionesRepository {
  create(createCapacitacionDto: CreateCapacitacionDto): Promise<Capacitacion>;
  /**
   * Si options.empresaId está definido, solo devuelve capacitaciones que tengan al menos una inscripción de esa empresa (para CLIENTE/OPERADOR).
   */
  findAll(
    pagination: PaginationDto,
    options?: { empresaId?: number },
  ): Promise<any>;
  findOne(id: number): Promise<Capacitacion | null>;
  update(
    id: number,
    updateCapacitacionDto: UpdateCapacitacionDto,
  ): Promise<Capacitacion>;
  remove(id: number): Promise<void>;
  existsByTitulo(titulo: string): Promise<boolean>;
}
