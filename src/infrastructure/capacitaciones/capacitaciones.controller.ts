import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnteCertificador } from '@/entities/catalogos/ente-certificador.entity';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles } from '@/infrastructure/shared/guards/roles.guard';
import { GetUser } from '@/infrastructure/shared/auth/decorators/get-user.decorator';
import { Usuario } from '@/entities/usuarios/usuario.entity';
import {
  CreateCapacitacionDto,
  UpdateCapacitacionDto,
} from '@/application/capacitaciones/dto';
import { CreateCapacitacionUseCase } from '@/application/capacitaciones/use-cases/create-capacitacion.use-case';
import { FindAllCapacitacionesUseCase } from '@/application/capacitaciones/use-cases/find-all-capacitaciones.use-case';
import { FindOneCapacitacionUseCase } from '@/application/capacitaciones/use-cases/find-one-capacitacion.use-case';
import { UpdateCapacitacionUseCase } from '@/application/capacitaciones/use-cases/update-capacitacion.use-case';
import { RemoveCapacitacionUseCase } from '@/application/capacitaciones/use-cases/remove-capacitacion.use-case';
import { LinkEvaluacionUseCase } from '@/application/capacitaciones/use-cases/link-evaluacion.use-case';
import { ToggleStatusUseCase } from '@/application/capacitaciones/use-cases/toggle-status.use-case';
import { LinkEvaluacionDto } from '@/application/capacitaciones/dto/link-evaluacion.dto';
import { EstadoCapacitacion } from '@/entities/capacitacion/types';
import { PaginationDto } from '@/application/shared/dto/pagination.dto';

@ApiTags('capacitaciones')
@Controller('capacitaciones')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth('JWT-auth')
export class CapacitacionesController {
  constructor(
    private readonly createCapacitacionUseCase: CreateCapacitacionUseCase,
    private readonly findAllCapacitacionesUseCase: FindAllCapacitacionesUseCase,
    private readonly findOneCapacitacionUseCase: FindOneCapacitacionUseCase,
    private readonly updateCapacitacionUseCase: UpdateCapacitacionUseCase,
    private readonly removeCapacitacionUseCase: RemoveCapacitacionUseCase,
    private readonly linkEvaluacionUseCase: LinkEvaluacionUseCase,
    private readonly toggleStatusUseCase: ToggleStatusUseCase,
    @InjectRepository(EnteCertificador)
    private readonly enteCertificadorRepository: Repository<EnteCertificador>,
  ) {}

  @Post()
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({
    summary: 'Crear una nueva capacitación',
    description:
      'Crea una nueva capacitación en el sistema con los datos proporcionados. Solo ADMIN e INSTRUCTOR pueden crear capacitaciones.',
  })
  @ApiBody({ type: CreateCapacitacionDto })
  @ApiResponse({
    status: 201,
    description: 'Capacitación creada exitosamente',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        titulo: { type: 'string', example: 'Capacitación en Seguridad Vial' },
        descripcion: {
          type: 'string',
          example: 'Curso completo de seguridad vial',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos o faltantes' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  create(@Body() createCapacitacionDto: CreateCapacitacionDto) {
    return this.createCapacitacionUseCase.execute(createCapacitacionDto);
  }

  @Get('catalog/entes-certificadores')
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({
    summary: 'Listar entes certificadores',
    description:
      'Catálogo de entes certificadores activos para asignar a capacitaciones.',
  })
  @ApiResponse({ status: 200, description: 'Lista de entes certificadores' })
  async getEntesCertificadores() {
    return this.enteCertificadorRepository.find({
      where: { activo: true },
      order: { nombre: 'ASC' },
    });
  }

  @Post('list')
  @Roles('ADMIN', 'INSTRUCTOR', 'ALUMNO', 'CLIENTE', 'OPERADOR')
  @ApiOperation({
    summary: 'Obtener lista de capacitaciones con paginación',
    description:
      'Lista paginada de capacitaciones. ADMIN/INSTRUCTOR/ALUMNO ven todo el catálogo. CLIENTE y OPERADOR solo ven cursos en los que su empresa tiene al menos un alumno inscrito (cursos asignados a su empresa).',
  })
  @ApiBody({ type: PaginationDto })
  @ApiResponse({
    status: 200,
    description: 'Lista de capacitaciones',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { type: 'object' },
        },
        total: { type: 'number', example: 100 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 10 },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Parámetros de paginación inválidos',
  })
  findAll(@Body() pagination: PaginationDto, @GetUser() user?: Usuario) {
    return this.findAllCapacitacionesUseCase.execute(pagination, user);
  }

  @Get(':id')
  @Roles('ADMIN', 'INSTRUCTOR', 'ALUMNO', 'CLIENTE', 'OPERADOR')
  @ApiOperation({ summary: 'Obtener una capacitación por ID' })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID de la capacitación',
  })
  @ApiResponse({ status: 200, description: 'Capacitación encontrada' })
  @ApiResponse({ status: 404, description: 'Capacitación no encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.findOneCapacitacionUseCase.execute(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({
    summary: 'Actualizar una capacitación',
    description:
      'Actualiza los datos de una capacitación existente. Solo se actualizan los campos proporcionados. Solo ADMIN e INSTRUCTOR pueden actualizar capacitaciones.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID de la capacitación a actualizar',
    example: 1,
  })
  @ApiBody({ type: UpdateCapacitacionDto })
  @ApiResponse({
    status: 200,
    description: 'Capacitación actualizada exitosamente',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        titulo: { type: 'string', example: 'Capacitación actualizada' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Capacitación no encontrada' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCapacitacionDto: UpdateCapacitacionDto,
  ) {
    return this.updateCapacitacionUseCase.execute(id, updateCapacitacionDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Eliminar una capacitación',
    description:
      'Elimina una capacitación del sistema. Esta acción puede tener efectos en cascada si hay inscripciones asociadas. Solo ADMIN puede eliminar capacitaciones.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID de la capacitación a eliminar',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Capacitación eliminada exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Capacitación eliminada exitosamente',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Capacitación no encontrada' })
  @ApiResponse({
    status: 409,
    description:
      'No se puede eliminar: la capacitación tiene inscripciones asociadas',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.removeCapacitacionUseCase.execute(id);
  }

  @Post(':id/evaluaciones')
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({
    summary:
      'Vincular una evaluación a una capacitación. Solo ADMIN e INSTRUCTOR pueden vincular evaluaciones.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID de la capacitación',
  })
  @ApiBody({ type: LinkEvaluacionDto })
  @ApiResponse({
    status: 200,
    description: 'Evaluación vinculada exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o evaluación ya vinculada',
  })
  @ApiResponse({
    status: 404,
    description: 'Capacitación o evaluación no encontrada',
  })
  linkEvaluacion(
    @Param('id', ParseIntPipe) id: number,
    @Body() linkEvaluacionDto: LinkEvaluacionDto,
  ) {
    return this.linkEvaluacionUseCase.execute(id, linkEvaluacionDto);
  }

  @Patch(':id/toggle-status')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Cambiar el estado de una capacitación (RF-10)',
    description:
      'Permite activar/desactivar cursos. Los certificados ya emitidos no se afectan. Solo ADMIN puede cambiar el estado de capacitaciones.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID de la capacitación',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        estado: {
          type: 'string',
          enum: Object.values(EstadoCapacitacion),
          description: 'Nuevo estado de la capacitación',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Estado cambiado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Estado inválido o mismo estado actual',
  })
  @ApiResponse({ status: 404, description: 'Capacitación no encontrada' })
  toggleStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('estado') estado: EstadoCapacitacion,
  ) {
    if (!estado || !Object.values(EstadoCapacitacion).includes(estado)) {
      throw new BadRequestException(
        `Estado inválido. Estados permitidos: ${Object.values(EstadoCapacitacion).join(', ')}`,
      );
    }
    return this.toggleStatusUseCase.execute(id, estado);
  }

  @Patch(':id/toggle-activo')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Toggle rápido entre activo/inactivo (RF-10)',
    description:
      'Alterna entre activo (PUBLICADA) e inactivo (BORRADOR). Los certificados no se afectan. Solo ADMIN puede activar/desactivar capacitaciones.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID de la capacitación',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado alternado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'No se puede activar sin evaluación',
  })
  @ApiResponse({ status: 404, description: 'Capacitación no encontrada' })
  toggleActivoInactivo(@Param('id', ParseIntPipe) id: number) {
    return this.toggleStatusUseCase.toggleActivoInactivo(id);
  }
}
