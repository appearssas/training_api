import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayMinSize, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Body del endpoint de completar capacitaciones para varios usuarios (admin).
 */
export class CompleteUserTrainingsBulkRequestDto {
  @ApiProperty({
    description: 'IDs de usuarios a procesar',
    example: [1, 2, 3],
    type: [Number],
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Debe enviar al menos un ID de usuario' })
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Type(() => Number)
  userIds: number[];
}
