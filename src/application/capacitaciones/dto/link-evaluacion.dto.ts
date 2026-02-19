import { IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LinkEvaluacionDto {
  @ApiProperty({
    description: 'ID de la evaluación a vincular',
    example: 1,
  })
  @IsInt()
  evaluacionId: number;
}
