import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description:
      'Nombre de usuario o email. El sistema acepta ambos formatos y detecta automáticamente el tipo.',
    example: 'juan.perez@example.com',
    examples: {
      email: {
        summary: 'Autenticación con email',
        value: 'juan.perez@example.com',
      },
      username: {
        summary: 'Autenticación con username',
        value: 'juan.perez',
      },
    },
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'password123',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
