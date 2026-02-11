import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles } from '@/infrastructure/shared/guards/roles.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Empresa } from '@/entities/empresas/empresa.entity';
import {
  CreateEmpresaDto,
  UpdateEmpresaDto,
  AssignCapacitacionesToEmpresaDto,
} from '@/application/empresas/dto';
import { sanitizeEmpresaData } from '@/infrastructure/shared/helpers/empresa-sanitizer.helper';
import { EmpresasCapacitacionesService } from './empresas-capacitaciones.service';

@ApiTags('empresas')
@Controller('empresas')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth('JWT-auth')
export class EmpresasController {
  constructor(
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
    private readonly empresasCapacitacionesService: EmpresasCapacitacionesService,
  ) {}

  @Get()
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar todas las empresas',
    description:
      'Obtiene una lista de todas las empresas activas. Solo disponible para ADMIN.',
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
          fechaCreacion: {
            type: 'string',
            example: '2025-01-15T10:30:00.000Z',
          },
          fechaActualizacion: {
            type: 'string',
            example: '2025-01-15T10:30:00.000Z',
          },
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
      where: { activo: true, eliminada: false },
      order: { razonSocial: 'ASC' },
    });
  }

  @Post()
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear una nueva empresa',
    description:
      'Crea una nueva empresa en el sistema. Solo disponible para ADMIN.',
  })
  @ApiBody({ type: CreateEmpresaDto })
  @ApiResponse({
    status: 201,
    description: 'Empresa creada exitosamente',
    schema: {
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
        fechaActualizacion: {
          type: 'string',
          example: '2025-01-15T10:30:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe una empresa con ese número de documento',
  })
  async create(@Body() createEmpresaDto: CreateEmpresaDto): Promise<Empresa> {
    const base = {
      ...createEmpresaDto,
      tipoDocumento: createEmpresaDto.tipoDocumento || 'NIT',
    };
    const sanitized = sanitizeEmpresaData(base);

    const existingEmpresa = await this.empresaRepository.findOne({
      where: { numeroDocumento: sanitized.numeroDocumento },
    });

    if (existingEmpresa) {
      throw new ConflictException(
        `Ya existe una empresa con el número de documento ${sanitized.numeroDocumento}`,
      );
    }

    const empresa = this.empresaRepository.create({
      ...sanitized,
      activo: true,
    });

    return await this.empresaRepository.save(empresa);
  }

  @Get('buscar')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Búsqueda avanzada de empresas',
    description:
      'Lista empresas con filtros (búsqueda por texto, estado activo, tipo documento) y paginación. Solo ADMIN.',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Texto en razón social, documento, email o teléfono',
  })
  @ApiQuery({
    name: 'activo',
    required: false,
    description: 'Filtrar por estado: true, false',
  })
  @ApiQuery({
    name: 'eliminadas',
    required: false,
    description:
      'true = solo empresas eliminadas (soft-delete). Si no, las eliminadas se excluyen de todos los filtros.',
  })
  @ApiQuery({
    name: 'tipoDocumento',
    required: false,
    description: 'Filtrar por tipo de documento (NIT, CC, etc.)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Página (default 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Registros por página (default 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de empresas',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/Empresa' },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  async buscar(
    @Query('search') search?: string,
    @Query('activo') activo?: string,
    @Query('eliminadas') eliminadas?: string,
    @Query('tipoDocumento') tipoDocumento?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{
    data: Empresa[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
    const limitNum = Math.min(
      100,
      Math.max(1, parseInt(limit || '10', 10) || 10),
    );
    const skip = (pageNum - 1) * limitNum;

    const qb = this.empresaRepository
      .createQueryBuilder('e')
      .orderBy('e.razonSocial', 'ASC');

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      qb.andWhere(
        '(e.razonSocial LIKE :term OR e.numeroDocumento LIKE :term OR e.email LIKE :term OR e.telefono LIKE :term)',
        { term },
      );
    }

    // Filtro eliminadas: si eliminadas=true, solo las eliminadas; si no, se excluyen de todos los resultados
    if (eliminadas === 'true') {
      qb.andWhere('e.eliminada = :eliminada', { eliminada: true });
    } else {
      qb.andWhere('e.eliminada = :eliminada', { eliminada: false });
      if (activo === 'true' || activo === 'false') {
        qb.andWhere('e.activo = :activo', { activo: activo === 'true' });
      }
    }

    if (tipoDocumento && tipoDocumento.trim()) {
      qb.andWhere('e.tipoDocumento = :tipoDocumento', {
        tipoDocumento: tipoDocumento.trim(),
      });
    }

    const [data, total] = await qb.skip(skip).take(limitNum).getManyAndCount();
    const totalPages = Math.ceil(total / limitNum);

    return { data, total, page: pageNum, limit: limitNum, totalPages };
  }

  @Patch(':id/toggle-status')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Activar o desactivar una empresa',
    description: 'Invierte el estado activo de la empresa. Solo ADMIN.',
  })
  @ApiParam({ name: 'id', type: 'number', description: 'ID de la empresa' })
  @ApiResponse({ status: 200, description: 'Empresa actualizada' })
  @ApiResponse({ status: 404, description: 'Empresa no encontrada' })
  async toggleStatus(@Param('id', ParseIntPipe) id: number): Promise<Empresa> {
    const empresa = await this.empresaRepository.findOne({ where: { id } });
    if (!empresa) {
      throw new NotFoundException(`Empresa con ID ${id} no encontrada`);
    }
    empresa.activo = !empresa.activo;
    return await this.empresaRepository.save(empresa);
  }

  @Put(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar una empresa',
    description:
      'Actualiza los datos de una empresa existente. Solo disponible para ADMIN.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID de la empresa a actualizar',
    example: 1,
  })
  @ApiBody({ type: UpdateEmpresaDto })
  @ApiResponse({
    status: 200,
    description: 'Empresa actualizada exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Empresa no encontrada',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe otra empresa con ese número de documento',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEmpresaDto: UpdateEmpresaDto,
  ): Promise<Empresa> {
    const empresa = await this.empresaRepository.findOne({ where: { id } });

    if (!empresa) {
      throw new NotFoundException(`Empresa con ID ${id} no encontrada`);
    }

    const sanitized = sanitizeEmpresaData(updateEmpresaDto);

    if (
      sanitized.numeroDocumento &&
      sanitized.numeroDocumento !== empresa.numeroDocumento
    ) {
      const existingEmpresa = await this.empresaRepository.findOne({
        where: { numeroDocumento: sanitized.numeroDocumento },
      });

      if (existingEmpresa) {
        throw new ConflictException(
          `Ya existe otra empresa con el número de documento ${sanitized.numeroDocumento}`,
        );
      }
    }

    Object.assign(empresa, sanitized);
    return await this.empresaRepository.save(empresa);
  }

  @Post(':id/capacitaciones')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Asignar cursos a una empresa (cliente institucional)',
    description:
      'Asigna capacitaciones (cursos) a una empresa. El usuario CLIENTE de esa empresa podrá luego asignar estos cursos a sus usuarios (conductores/empleados). Solo ADMIN.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID de la empresa (cliente institucional)',
    example: 1,
  })
  @ApiBody({ type: AssignCapacitacionesToEmpresaDto })
  @ApiResponse({
    status: 200,
    description: 'Cursos asignados a la empresa',
    schema: {
      type: 'object',
      properties: {
        assigned: { type: 'number', example: 3 },
        skipped: { type: 'number', example: 0 },
        details: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Empresa no encontrada' })
  async assignCapacitaciones(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignCapacitacionesToEmpresaDto,
  ) {
    return this.empresasCapacitacionesService.assignCapacitacionesToEmpresa(
      id,
      dto.courseIds,
    );
  }

  @Delete(':id/capacitaciones/:capacitacionId')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Quitar un curso de una empresa',
    description:
      'Elimina la asignación del curso a la empresa. La empresa deja de poder asignar ese curso a sus usuarios. Solo ADMIN.',
  })
  @ApiParam({ name: 'id', description: 'ID de la empresa' })
  @ApiParam({
    name: 'capacitacionId',
    description: 'ID de la capacitación (curso)',
  })
  @ApiResponse({ status: 200, description: 'Curso quitado de la empresa' })
  async removeCapacitacionFromEmpresa(
    @Param('id', ParseIntPipe) id: number,
    @Param('capacitacionId', ParseIntPipe) capacitacionId: number,
  ) {
    return this.empresasCapacitacionesService.removeCapacitacionFromEmpresa(
      id,
      capacitacionId,
    );
  }

  @Get('por-capacitacion/:capacitacionId')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Listar empresas con un curso asignado',
    description:
      'Devuelve las empresas que tienen asignado el curso (para que el admin pueda quitar). Solo ADMIN.',
  })
  @ApiParam({ name: 'capacitacionId', description: 'ID de la capacitación' })
  @ApiResponse({ status: 200, description: 'Lista de empresas' })
  async getEmpresasByCapacitacion(
    @Param('capacitacionId', ParseIntPipe) capacitacionId: number,
  ) {
    return this.empresasCapacitacionesService.getEmpresasByCapacitacion(
      capacitacionId,
    );
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar (desactivar) una empresa',
    description:
      'Desactiva una empresa en el sistema (soft delete). Solo disponible para ADMIN.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID de la empresa a desactivar',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Empresa desactivada exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Empresa no encontrada',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    const empresa = await this.empresaRepository.findOne({ where: { id } });

    if (!empresa) {
      throw new NotFoundException(`Empresa con ID ${id} no encontrada`);
    }

    empresa.activo = false;
    empresa.eliminada = true;
    await this.empresaRepository.save(empresa);

    return {
      message: `Empresa ${empresa.razonSocial} ha sido eliminada exitosamente`,
    };
  }
}
