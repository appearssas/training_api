import { IsArray, IsInt, ArrayMinSize, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignCapacitacionesToEmpresaDto {
  @ApiProperty({
    description:
      'IDs de capacitaciones (cursos) a asignar a la empresa. El cliente institucional podrá asignar estos cursos a sus usuarios.',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray({ message: 'courseIds debe ser un array' })
  @ArrayMinSize(1, { message: 'Debe incluir al menos un curso' })
  @IsInt({ each: true, message: 'Cada ID de curso debe ser un número entero' })
  @IsPositive({ each: true, message: 'Cada ID de curso debe ser positivo' })
  courseIds: number[];
}
