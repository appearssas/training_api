import {
  Controller,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles } from '@/infrastructure/shared/guards/roles.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Empresa } from '@/entities/empresas/empresa.entity';

@ApiTags('empresas')
@Controller('empresas')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth('JWT-auth')
export class EmpresasController {
  constructor(
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
  ) {}

  @Get()
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar todas las empresas',
    description: 'Obtiene una lista de todas las empresas activas. Solo disponible para ADMIN.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de empresas obtenida exitosamente',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          numeroDocumento: { type: 'string', example: '900123456-1' },
          tipoDocumento: { type: 'string', example: 'NIT' },
          razonSocial: { type: 'string', example: 'Empresa SAS' },
          email: { type: 'string', example: 'contacto@empresa.com' },
          telefono: { type: 'string', example: '+573001234567' },
          direccion: { type: 'string', example: 'Calle 123 #45-67' },
          activo: { type: 'boolean', example: true },
          fechaCreacion: { type: 'string', example: '2025-01-15T10:30:00.000Z' },
          fechaActualizacion: { type: 'string', example: '2025-01-15T10:30:00.000Z' },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado - Token JWT inválido, expirado o ausente',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado - Se requiere rol de administrador (ADMIN)',
  })
  async findAll(): Promise<Empresa[]> {
    return await this.empresaRepository.find({
      where: { activo: true },
      order: { razonSocial: 'ASC' },
    });
  }
}

