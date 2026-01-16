import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDocumentoLegalDto {
  @ApiProperty({
    description:
      'Tipo de documento legal. Valores comunes: TERMINOS, POLITICA_PRIVACIDAD, POLITICA_DATOS, OTRO',
    example: 'TERMINOS',
    maxLength: 50,
    enum: ['TERMINOS', 'POLITICA_PRIVACIDAD', 'POLITICA_DATOS', 'OTRO'],
  })
  @IsString({ message: 'El tipo debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El tipo es requerido' })
  @MaxLength(50, { message: 'El tipo no puede exceder 50 caracteres' })
  tipo: string;

  @ApiProperty({
    description: 'Título del documento legal',
    example: 'Términos y Condiciones de Uso',
    maxLength: 200,
  })
  @IsString({ message: 'El título debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El título es requerido' })
  @MaxLength(200, { message: 'El título no puede exceder 200 caracteres' })
  titulo: string;

  @ApiProperty({
    description: 'Contenido del documento legal (HTML o texto)',
    example: '<p>Contenido del documento...</p>',
  })
  @IsString({ message: 'El contenido debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El contenido es requerido' })
  contenido: string;

  @ApiPropertyOptional({
    description: 'Versión del documento',
    example: '1.0',
    default: '1.0',
    maxLength: 20,
  })
  @IsOptional()
  @IsString({ message: 'La versión debe ser una cadena de texto' })
  @MaxLength(20, { message: 'La versión no puede exceder 20 caracteres' })
  @Matches(/^\d+\.\d+$/, {
    message: 'La versión debe tener el formato X.Y (ej: 1.0, 2.1)',
  })
  version?: string;

  @ApiPropertyOptional({
    description: 'Indica si el documento requiere firma digital',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'requiereFirmaDigital debe ser un valor booleano' })
  requiereFirmaDigital?: boolean;

  @ApiPropertyOptional({
    description: 'Estado activo del documento',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'El estado activo debe ser un valor booleano' })
  activo?: boolean;
}
