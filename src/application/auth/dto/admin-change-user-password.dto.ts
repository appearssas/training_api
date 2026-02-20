import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdminChangeUserPasswordDto {
  @ApiProperty({
    description: 'Contraseña del administrador (para verificar identidad)',
    example: 'MiPasswordAdmin123!',
  })
  @IsString()
  @IsNotEmpty({ message: 'Debe ingresar su contraseña de administrador' })
  adminPassword: string;

  @ApiProperty({
    description:
      'Nueva contraseña para el usuario (mínimo 8 caracteres, mayúsculas, minúsculas, números y símbolos)',
    example: 'NuevaPassword123!',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, {
    message: 'La nueva contraseña debe tener al menos 8 caracteres',
  })
  newPassword: string;
}
