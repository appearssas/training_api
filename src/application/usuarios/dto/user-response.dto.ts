import { ApiProperty } from '@nestjs/swagger';

export class EmpresaResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '900123456-1' })
  numeroDocumento: string;

  @ApiProperty({ example: 'Empresa SAS' })
  razonSocial: string;
}

export class PersonaResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '1234567890' })
  numeroDocumento: string;

  @ApiProperty({ example: 'CC' })
  tipoDocumento: string;

  @ApiProperty({ example: 'Juan' })
  nombres: string;

  @ApiProperty({ example: 'Pérez', required: false })
  apellidos?: string;

  @ApiProperty({ example: 'juan.perez@example.com', required: false })
  email?: string;

  @ApiProperty({ example: '+573001234567', required: false })
  telefono?: string;

  @ApiProperty({ example: '1990-01-15', required: false })
  fechaNacimiento?: Date;

  @ApiProperty({ example: 'M', required: false })
  genero?: string;

  @ApiProperty({ example: 'Calle 123 #45-67', required: false })
  direccion?: string;

  @ApiProperty({ example: true })
  activo: boolean;

  @ApiProperty({ example: '2025-01-15T10:30:00.000Z' })
  fechaCreacion: Date;

  @ApiProperty({ example: '2025-01-15T10:30:00.000Z' })
  fechaActualizacion: Date;

  @ApiProperty({ type: EmpresaResponseDto, required: false })
  empresa?: EmpresaResponseDto;

  @ApiProperty({ example: 1, required: false })
  empresaId?: number;
}

export class RolResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'ADMIN' })
  codigo: string;

  @ApiProperty({ example: 'Administrador' })
  nombre: string;

  @ApiProperty({ example: true })
  activo: boolean;
}

export class UserResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ type: PersonaResponseDto })
  persona: PersonaResponseDto;

  @ApiProperty({ example: 'juan.perez' })
  username: string;

  @ApiProperty({ type: RolResponseDto, required: false })
  rolPrincipal?: RolResponseDto;

  @ApiProperty({ example: true })
  habilitado: boolean;

  @ApiProperty({ example: true })
  activo: boolean;

  @ApiProperty({ example: false })
  debeCambiarPassword: boolean;

  @ApiProperty({ example: '2025-01-15T10:30:00.000Z', required: false })
  ultimoAcceso?: Date;

  @ApiProperty({ example: '2025-01-15T10:30:00.000Z' })
  fechaCreacion: Date;

  @ApiProperty({ example: '2025-01-15T10:30:00.000Z' })
  fechaActualizacion: Date;
}

export class ListUsersResponseDto {
  @ApiProperty({ type: [UserResponseDto] })
  data: UserResponseDto[];

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 10 })
  totalPages: number;
}

