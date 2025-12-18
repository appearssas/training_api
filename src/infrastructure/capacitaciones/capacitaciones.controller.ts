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
  @ApiOperation({ summary: 'Crear una nueva capacitación' })
  @ApiBody({ type: CreateCapacitacionDto })
  @ApiResponse({ status: 201, description: 'Capacitación creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  create(@Body() createCapacitacionDto: CreateCapacitacionDto) {
    return this.createCapacitacionUseCase.execute(createCapacitacionDto);
  }

  @Post('list')
  @ApiOperation({ summary: 'Obtener lista de capacitaciones con paginación' })
  @ApiBody({ type: PaginationDto })
  @ApiResponse({ status: 200, description: 'Lista de capacitaciones' })
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
  @ApiOperation({ summary: 'Actualizar una capacitación' })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID de la capacitación',
  })
  @ApiBody({ type: UpdateCapacitacionDto })
  @ApiResponse({
    status: 200,
    description: 'Capacitación actualizada exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Capacitación no encontrada' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCapacitacionDto: UpdateCapacitacionDto,
  ) {
    return this.updateCapacitacionUseCase.execute(id, updateCapacitacionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una capacitación' })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID de la capacitación',
  })
  @ApiResponse({
    status: 200,
    description: 'Capacitación eliminada exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Capacitación no encontrada' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.removeCapacitacionUseCase.execute(id);
  }
}
