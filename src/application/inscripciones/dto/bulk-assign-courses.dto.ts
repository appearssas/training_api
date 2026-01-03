import { IsArray, IsInt, ArrayMinSize, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkAssignCoursesDto {
  @ApiProperty({
    description: 'Array de IDs de usuarios (estudiantes) a los que se asignarán los cursos',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray({ message: 'Los IDs de usuarios deben ser un array' })
  @ArrayMinSize(1, { message: 'Debe seleccionar al menos un usuario' })
  @IsInt({ each: true, message: 'Cada ID de usuario debe ser un número entero' })
  @IsPositive({ each: true, message: 'Cada ID de usuario debe ser positivo' })
  userIds: number[];

  @ApiProperty({
    description: 'Array de IDs de cursos (capacitaciones) que se asignarán a los usuarios',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray({ message: 'Los IDs de cursos deben ser un array' })
  @ArrayMinSize(1, { message: 'Debe seleccionar al menos un curso' })
  @IsInt({ each: true, message: 'Cada ID de curso debe ser un número entero' })
  @IsPositive({ each: true, message: 'Cada ID de curso debe ser positivo' })
  courseIds: number[];
}

