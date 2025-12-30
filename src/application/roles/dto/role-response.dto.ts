import { ApiProperty } from '@nestjs/swagger';

export class RoleResponseDto {
  @ApiProperty({
    description: 'ID del rol',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Nombre del rol',
    example: 'Administrador',
  })
  nombre: string;

  @ApiProperty({
    description: 'Código único del rol',
    example: 'ADMIN',
  })
  codigo: string;

  @ApiProperty({
    description: 'Descripción del rol',
    example: 'Rol de administrador del sistema',
    required: false,
  })
  descripcion?: string;

  @ApiProperty({
    description: 'Indica si el rol está activo',
    example: true,
  })
  activo: boolean;

  @ApiProperty({
    description: 'Fecha de creación del rol',
    example: '2025-01-15T10:30:00.000Z',
  })
  fechaCreacion: Date;
}

export class ListRolesResponseDto {
  @ApiProperty({
    description: 'Lista de roles',
    type: [RoleResponseDto],
  })
  data: RoleResponseDto[];
}

