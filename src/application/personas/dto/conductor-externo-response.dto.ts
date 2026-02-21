import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PersonaResponseDto {
  @ApiProperty({
    description: 'ID único de la persona',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Número de documento de identidad',
    example: '1234567890',
  })
  numeroDocumento: string;

  @ApiProperty({
    description: 'Tipo de documento',
    example: 'CC',
    enum: ['CC', 'TI', 'CE', 'PA', 'RC', 'NIT'],
  })
  tipoDocumento: string;

  @ApiProperty({
    description: 'Nombres de la persona',
    example: 'Juan',
  })
  nombres: string;

  @ApiProperty({
    description: 'Apellidos de la persona',
    example: 'Pérez',
  })
  apellidos: string;

  @ApiPropertyOptional({
    description: 'Correo electrónico',
    example: 'juan.perez@example.com',
  })
  email?: string;

  @ApiPropertyOptional({
    description: 'Número de teléfono',
    example: '+573001234567',
  })
  telefono?: string;

  @ApiPropertyOptional({
    description: 'Fecha de nacimiento',
    example: '1990-01-15',
    type: Date,
  })
  fechaNacimiento?: Date;

  @ApiPropertyOptional({
    description: 'Género',
    example: 'M',
    enum: ['M', 'F', 'O'],
  })
  genero?: string;

  @ApiPropertyOptional({
    description: 'Dirección de residencia',
    example: 'Calle 123 #45-67',
  })
  direccion?: string;

  @ApiProperty({
    description: 'Indica si la persona está activa',
    example: true,
  })
  activo: boolean;

  @ApiProperty({
    description: 'Fecha de creación del registro',
    example: '2025-01-15T10:30:00.000Z',
    type: Date,
  })
  fechaCreacion: Date;
}

export class AlumnoResponseDto {
  @ApiProperty({
    description: 'ID único del alumno',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Código de estudiante generado automáticamente',
    example: 'EST20250001',
    pattern: '^EST\\d{9}$',
  })
  codigoEstudiante: string;

  @ApiProperty({
    description: 'Indica si el alumno es externo (conductor externo)',
    example: true,
  })
  esExterno: boolean;

  @ApiProperty({
    description: 'Fecha de ingreso del alumno',
    example: '2025-01-15',
    type: Date,
  })
  fechaIngreso: Date;

  @ApiProperty({
    description: 'Indica si el alumno está activo',
    example: true,
  })
  activo: boolean;

  @ApiProperty({
    description: 'Fecha de creación del registro',
    example: '2025-01-15T10:30:00.000Z',
    type: Date,
  })
  fechaCreacion: Date;
}

export class ConductorExternoResponseDto {
  @ApiProperty({
    description: 'Datos de la persona creada',
    type: PersonaResponseDto,
  })
  persona: PersonaResponseDto;

  @ApiProperty({
    description: 'Datos del alumno externo creado',
    type: AlumnoResponseDto,
  })
  alumno: AlumnoResponseDto;
}
