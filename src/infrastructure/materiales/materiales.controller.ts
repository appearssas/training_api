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
  CreateMaterialDto,
  UpdateMaterialDto,
} from '@/application/materiales/dto';
import { CreateMaterialUseCase } from '@/application/materiales/use-cases/create-material.use-case';
import { UpdateMaterialUseCase } from '@/application/materiales/use-cases/update-material.use-case';
import { RemoveMaterialUseCase } from '@/application/materiales/use-cases/remove-material.use-case';
import { FindMaterialsByCapacitacionUseCase } from '@/application/materiales/use-cases/find-materials-by-capacitacion.use-case';
import { FindOneMaterialUseCase } from '@/application/materiales/use-cases/find-one-material.use-case';

@ApiTags('materiales')
@Controller('materiales')
export class MaterialesController {
  constructor(
    private readonly createMaterialUseCase: CreateMaterialUseCase,
    private readonly updateMaterialUseCase: UpdateMaterialUseCase,
    private readonly removeMaterialUseCase: RemoveMaterialUseCase,
    private readonly findMaterialsByCapacitacionUseCase: FindMaterialsByCapacitacionUseCase,
    private readonly findOneMaterialUseCase: FindOneMaterialUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo material' })
  @ApiBody({ type: CreateMaterialDto })
  @ApiResponse({ status: 201, description: 'Material creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  create(@Body() createMaterialDto: CreateMaterialDto) {
    return this.createMaterialUseCase.execute(createMaterialDto);
  }

  @Get('capacitacion/:capacitacionId')
  @ApiOperation({
    summary: 'Obtener todos los materiales de una capacitación',
  })
  @ApiParam({
    name: 'capacitacionId',
    type: 'number',
    description: 'ID de la capacitación',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de materiales de la capacitación',
  })
  findByCapacitacion(@Param('capacitacionId', ParseIntPipe) capacitacionId: number) {
    return this.findMaterialsByCapacitacionUseCase.execute(capacitacionId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un material por ID' })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID del material',
  })
  @ApiResponse({ status: 200, description: 'Material encontrado' })
  @ApiResponse({ status: 404, description: 'Material no encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.findOneMaterialUseCase.execute(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un material' })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID del material',
  })
  @ApiBody({ type: UpdateMaterialDto })
  @ApiResponse({
    status: 200,
    description: 'Material actualizado exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Material no encontrado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMaterialDto: UpdateMaterialDto,
  ) {
    return this.updateMaterialUseCase.execute(id, updateMaterialDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un material' })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID del material',
  })
  @ApiResponse({
    status: 200,
    description: 'Material eliminado exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Material no encontrado' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.removeMaterialUseCase.execute(id);
  }
}

