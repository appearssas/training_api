import { PartialType } from '@nestjs/swagger';
import { CreateEvaluacionDto } from './create-evaluacion.dto';

/**
 * DTO para actualizar una evaluación
 * Extiende CreateEvaluacionDto haciendo todos los campos opcionales
 * Permite actualizar parcialmente la evaluación, incluyendo preguntas y opciones
 */
export class UpdateEvaluacionDto extends PartialType(CreateEvaluacionDto) {}

