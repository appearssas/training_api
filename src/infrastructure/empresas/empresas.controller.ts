import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles } from '@/infrastructure/shared/guards/roles.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Empresa } from '@/entities/empresas/empresa.entity';
import { CreateEmpresaDto, UpdateEmpresaDto } from '@/application/empresas/dto';

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

  @Post()
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear una nueva empresa',
    description: 'Crea una nueva empresa en el sistema. Solo disponible para ADMIN.',
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
        fechaActualizacion: { type: 'string', example: '2025-01-15T10:30:00.000Z' },
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
    // Verificar si ya existe una empresa con el mismo número de documento
    const existingEmpresa = await this.empresaRepository.findOne({
      where: { numeroDocumento: createEmpresaDto.numeroDocumento },
    });

    if (existingEmpresa) {
      throw new ConflictException(
        `Ya existe una empresa con el número de documento ${createEmpresaDto.numeroDocumento}`,
      );
    }

    const empresa = this.empresaRepository.create({
      ...createEmpresaDto,
      tipoDocumento: createEmpresaDto.tipoDocumento || 'NIT',
      activo: true,
    });

    return await this.empresaRepository.save(empresa);
  }

  @Put(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar una empresa',
    description: 'Actualiza los datos de una empresa existente. Solo disponible para ADMIN.',
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

    // Si se está actualizando el número de documento, verificar que no exista otra empresa con el mismo
    if (updateEmpresaDto.numeroDocumento && updateEmpresaDto.numeroDocumento !== empresa.numeroDocumento) {
      const existingEmpresa = await this.empresaRepository.findOne({
        where: { numeroDocumento: updateEmpresaDto.numeroDocumento },
      });

      if (existingEmpresa) {
        throw new ConflictException(
          `Ya existe otra empresa con el número de documento ${updateEmpresaDto.numeroDocumento}`,
        );
      }
    }

    Object.assign(empresa, updateEmpresaDto);
    return await this.empresaRepository.save(empresa);
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
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    const empresa = await this.empresaRepository.findOne({ where: { id } });

    if (!empresa) {
      throw new NotFoundException(`Empresa con ID ${id} no encontrada`);
    }

    empresa.activo = false;
    await this.empresaRepository.save(empresa);

    return { message: `Empresa ${empresa.razonSocial} ha sido desactivada exitosamente` };
  }
}

