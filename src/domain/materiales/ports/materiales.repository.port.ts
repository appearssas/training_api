import { MaterialCapacitacion } from '@/entities/materiales/material-capacitacion.entity';
import { CreateMaterialDto } from '@/application/materiales/dto/create-material.dto';
import { UpdateMaterialDto } from '@/application/materiales/dto/update-material.dto';

/**
 * Puerto para el repositorio de Materiales
 * Define el contrato que debe cumplir cualquier implementación
 */
export interface IMaterialesRepository {
  /**
   * Crear un nuevo material
   */
  create(createMaterialDto: CreateMaterialDto): Promise<MaterialCapacitacion>;

  /**
   * Obtener todos los materiales de una capacitación
   */
  findByCapacitacion(capacitacionId: number): Promise<MaterialCapacitacion[]>;

  /**
   * Obtener un material por ID
   */
  findOne(id: number): Promise<MaterialCapacitacion | null>;

  /**
   * Actualizar un material existente
   */
  update(
    id: number,
    updateMaterialDto: UpdateMaterialDto,
  ): Promise<MaterialCapacitacion>;

  /**
   * Eliminar un material
   */
  remove(id: number): Promise<void>;
}
