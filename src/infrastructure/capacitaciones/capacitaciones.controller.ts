import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  CreateCapacitacionDto,
  UpdateCapacitacionDto,
} from '@/application/capacitaciones/dto';
import { CreateCapacitacionUseCase } from '@/application/capacitaciones/use-cases/create-capacitacion.use-case';
import { FindAllCapacitacionesUseCase } from '@/application/capacitaciones/use-cases/find-all-capacitaciones.use-case';
import { FindOneCapacitacionUseCase } from '@/application/capacitaciones/use-cases/find-one-capacitacion.use-case';
import { UpdateCapacitacionUseCase } from '@/application/capacitaciones/use-cases/update-capacitacion.use-case';
import { RemoveCapacitacionUseCase } from '@/application/capacitaciones/use-cases/remove-capacitacion.use-case';
import { PaginationDto } from '@/application/shared/dto/pagination.dto';

@ApiTags('capacitaciones')
@Controller('capacitaciones')
export class CapacitacionesController {
  constructor(
    private readonly createCapacitacionUseCase: CreateCapacitacionUseCase,
    private readonly findAllCapacitacionesUseCase: FindAllCapacitacionesUseCase,
    private readonly findOneCapacitacionUseCase: FindOneCapacitacionUseCase,
    private readonly updateCapacitacionUseCase: UpdateCapacitacionUseCase,
    private readonly removeCapacitacionUseCase: RemoveCapacitacionUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Crear una nueva capacitación',
    description: 'Crea una nueva capacitación en el sistema con los datos proporcionados',
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
        descripcion: { type: 'string', example: 'Curso completo de seguridad vial' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos o faltantes' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  create(@Body() createCapacitacionDto: CreateCapacitacionDto) {
    return this.createCapacitacionUseCase.execute(createCapacitacionDto);
  }

  @Post('list')
  @ApiOperation({
    summary: 'Obtener lista de capacitaciones con paginación',
    description:
      'Obtiene una lista paginada de todas las capacitaciones disponibles en el sistema',
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
  @ApiResponse({ status: 400, description: 'Parámetros de paginación inválidos' })
  findAll(@Body() pagination: PaginationDto) {
    return this.findAllCapacitacionesUseCase.execute(pagination);
  }

  @Get(':id')
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
  @ApiOperation({
    summary: 'Actualizar una capacitación',
    description: 'Actualiza los datos de una capacitación existente. Solo se actualizan los campos proporcionados.',
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
  @ApiOperation({
    summary: 'Eliminar una capacitación',
    description:
      'Elimina una capacitación del sistema. Esta acción puede tener efectos en cascada si hay inscripciones asociadas.',
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
    description: 'No se puede eliminar: la capacitación tiene inscripciones asociadas',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.removeCapacitacionUseCase.execute(id);
  }
}
