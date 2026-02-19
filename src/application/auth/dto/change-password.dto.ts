import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Contraseña temporal actual',
    example: 'TEMP_A3b7K9m2P5q',
  })
  @IsString()
  @IsNotEmpty()
  passwordTemporal: string;

  @ApiProperty({
    description:
      'Nueva contraseña (mínimo 8 caracteres, debe incluir mayúsculas, minúsculas, números y símbolos)',
    example: 'NuevaPassword123!',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  nuevaPassword: string;
}
