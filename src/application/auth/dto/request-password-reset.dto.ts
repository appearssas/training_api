import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RequestPasswordResetDto {
  @ApiProperty({
    description: 'Nombre de usuario o email para recuperar contraseña',
    example: 'juan.perez',
  })
  @IsString()
  @IsNotEmpty({ message: 'El usuario o email es requerido' })
  usernameOrEmail: string;
}
