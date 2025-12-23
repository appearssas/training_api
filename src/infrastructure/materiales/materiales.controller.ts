import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
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
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth('JWT-auth')
export class MaterialesController {
  constructor(
    private readonly createMaterialUseCase: CreateMaterialUseCase,
    private readonly updateMaterialUseCase: UpdateMaterialUseCase,
    private readonly removeMaterialUseCase: RemoveMaterialUseCase,
    private readonly findMaterialsByCapacitacionUseCase: FindMaterialsByCapacitacionUseCase,
    private readonly findOneMaterialUseCase: FindOneMaterialUseCase,
  ) {}

  @Post()
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({ summary: 'Crear un nuevo material. Solo ADMIN e INSTRUCTOR pueden crear materiales.' })
  @ApiBody({ type: CreateMaterialDto })
  @ApiResponse({ status: 201, description: 'Material creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  create(@Body() createMaterialDto: CreateMaterialDto) {
    return this.createMaterialUseCase.execute(createMaterialDto);
  }

  @Get('capacitacion/:capacitacionId')
  @Roles('ADMIN', 'INSTRUCTOR', 'ALUMNO', 'CLIENTE', 'OPERADOR')
  @ApiOperation({
    summary: 'Obtener todos los materiales de una capacitación',
    description: 'Todos los roles autenticados pueden ver materiales de capacitaciones.',
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
  @Roles('ADMIN', 'INSTRUCTOR', 'ALUMNO', 'CLIENTE', 'OPERADOR')
  @ApiOperation({ summary: 'Obtener un material por ID. Todos los roles autenticados pueden ver materiales.' })
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
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({ summary: 'Actualizar un material. Solo ADMIN e INSTRUCTOR pueden actualizar materiales.' })
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
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({ summary: 'Eliminar un material. Solo ADMIN e INSTRUCTOR pueden eliminar materiales.' })
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

