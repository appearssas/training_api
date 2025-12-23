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
  CreateInscripcionDto,
  UpdateInscripcionDto,
} from '@/application/inscripciones/dto';
import { CreateInscripcionUseCase } from '@/application/inscripciones/use-cases/create-inscripcion.use-case';
import { FindAllInscripcionesUseCase } from '@/application/inscripciones/use-cases/find-all-inscripciones.use-case';
import { FindOneInscripcionUseCase } from '@/application/inscripciones/use-cases/find-one-inscripcion.use-case';
import { UpdateInscripcionUseCase } from '@/application/inscripciones/use-cases/update-inscripcion.use-case';
import { RemoveInscripcionUseCase } from '@/application/inscripciones/use-cases/remove-inscripcion.use-case';
import { FindByEstudianteUseCase } from '@/application/inscripciones/use-cases/find-by-estudiante.use-case';
import { FindByCapacitacionUseCase } from '@/application/inscripciones/use-cases/find-by-capacitacion.use-case';
import { PaginationDto } from '@/application/shared/dto/pagination.dto';

/**
 * Controlador de Inscripciones
 * Gestiona las operaciones CRUD y consultas relacionadas con inscripciones de estudiantes a capacitaciones
 */
@ApiTags('inscripciones')
@Controller('inscripciones')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth('JWT-auth')
export class InscripcionesController {
  constructor(
    private readonly createInscripcionUseCase: CreateInscripcionUseCase,
    private readonly findAllInscripcionesUseCase: FindAllInscripcionesUseCase,
    private readonly findOneInscripcionUseCase: FindOneInscripcionUseCase,
    private readonly updateInscripcionUseCase: UpdateInscripcionUseCase,
    private readonly removeInscripcionUseCase: RemoveInscripcionUseCase,
    private readonly findByEstudianteUseCase: FindByEstudianteUseCase,
    private readonly findByCapacitacionUseCase: FindByCapacitacionUseCase,
  ) {}

  @Post()
  @Roles('ADMIN', 'ALUMNO', 'CLIENTE')
  @ApiOperation({
    summary: 'Crear una nueva inscripción',
    description:
      'Inscribe un estudiante a una capacitación. Valida que la capacitación esté disponible (PUBLICADA o EN_CURSO), ' +
      'que el estudiante no esté ya inscrito, y que no se exceda la capacidad máxima si está definida. ' +
      'Para conductores externos, el pago es requerido. ADMIN, ALUMNO y CLIENTE pueden crear inscripciones.',
  })
  @ApiBody({ type: CreateInscripcionDto })
  @ApiResponse({
    status: 201,
    description: 'Inscripción creada exitosamente',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        fechaInscripcion: { type: 'string', format: 'date-time' },
        estado: { type: 'string', example: 'inscrito' },
        progresoPorcentaje: { type: 'number', example: 0 },
        capacitacion: { type: 'object' },
        estudiante: { type: 'object' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o reglas de negocio no cumplidas',
  })
  @ApiResponse({
    status: 404,
    description: 'Capacitación o estudiante no encontrado',
  })
  create(@Body() createInscripcionDto: CreateInscripcionDto) {
    return this.createInscripcionUseCase.execute(createInscripcionDto);
  }

  @Post('list')
  @Roles('ADMIN', 'INSTRUCTOR', 'CLIENTE', 'OPERADOR')
  @ApiOperation({
    summary: 'Obtener lista de inscripciones con paginación',
    description:
      'Obtiene todas las inscripciones del sistema con opciones de paginación, búsqueda y filtrado. ADMIN, INSTRUCTOR, CLIENTE y OPERADOR pueden ver todas las inscripciones.',
  })
  @ApiBody({ type: PaginationDto })
  @ApiResponse({
    status: 200,
    description: 'Lista de inscripciones obtenida exitosamente',
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
        totalPages: { type: 'number', example: 10 },
      },
    },
  })
  findAll(@Body() pagination: PaginationDto) {
    return this.findAllInscripcionesUseCase.execute(pagination);
  }

  @Get(':id')
  @Roles('ADMIN', 'INSTRUCTOR', 'ALUMNO', 'CLIENTE', 'OPERADOR')
  @ApiOperation({
    summary: 'Obtener una inscripción por ID',
    description: 'Obtiene los detalles completos de una inscripción específica, incluyendo relaciones con capacitación y estudiante. Todos los roles autenticados pueden ver inscripciones.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID de la inscripción',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Inscripción encontrada',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        fechaInscripcion: { type: 'string', format: 'date-time' },
        estado: { type: 'string', example: 'inscrito' },
        progresoPorcentaje: { type: 'number', example: 45.5 },
        capacitacion: { type: 'object' },
        estudiante: { type: 'object' },
        pago: { type: 'object', nullable: true },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Inscripción no encontrada',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.findOneInscripcionUseCase.execute(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({
    summary: 'Actualizar una inscripción',
    description:
      'Actualiza los datos de una inscripción existente. Permite actualizar estado, progreso, fechas, calificación y aprobación. Solo ADMIN e INSTRUCTOR pueden actualizar inscripciones.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID de la inscripción',
    example: 1,
  })
  @ApiBody({ type: UpdateInscripcionDto })
  @ApiResponse({
    status: 200,
    description: 'Inscripción actualizada exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Inscripción no encontrada',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateInscripcionDto: UpdateInscripcionDto,
  ) {
    return this.updateInscripcionUseCase.execute(id, updateInscripcionDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Eliminar una inscripción',
    description: 'Elimina una inscripción del sistema. Esta acción no se puede deshacer. Solo ADMIN puede eliminar inscripciones.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID de la inscripción',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Inscripción eliminada exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Inscripción no encontrada',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.removeInscripcionUseCase.execute(id);
  }

  @Post('estudiante/:estudianteId')
  @Roles('ADMIN', 'ALUMNO', 'CLIENTE', 'INSTRUCTOR', 'OPERADOR')
  @ApiOperation({
    summary: 'Obtener inscripciones de un estudiante',
    description:
      'Obtiene todas las inscripciones de un estudiante específico con paginación. Útil para ver el historial de cursos de un estudiante. Todos los roles autenticados pueden ver inscripciones de estudiantes.',
  })
  @ApiParam({
    name: 'estudianteId',
    type: 'number',
    description: 'ID del estudiante (Persona)',
    example: 1,
  })
  @ApiBody({ type: PaginationDto, required: false })
  @ApiResponse({
    status: 200,
    description: 'Lista de inscripciones del estudiante',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { type: 'object' },
        },
        total: { type: 'number', example: 5 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 10 },
        totalPages: { type: 'number', example: 1 },
      },
    },
  })
  findByEstudiante(
    @Param('estudianteId', ParseIntPipe) estudianteId: number,
    @Body() pagination?: PaginationDto,
  ) {
    return this.findByEstudianteUseCase.execute(estudianteId, pagination);
  }

  @Post('capacitacion/:capacitacionId')
  @Roles('ADMIN', 'INSTRUCTOR', 'CLIENTE', 'OPERADOR')
  @ApiOperation({
    summary: 'Obtener inscripciones de una capacitación',
    description:
      'Obtiene todas las inscripciones de una capacitación específica con paginación. Útil para ver la lista de estudiantes inscritos en un curso. ADMIN, INSTRUCTOR, CLIENTE y OPERADOR pueden ver inscripciones de capacitaciones.',
  })
  @ApiParam({
    name: 'capacitacionId',
    type: 'number',
    description: 'ID de la capacitación',
    example: 1,
  })
  @ApiBody({ type: PaginationDto, required: false })
  @ApiResponse({
    status: 200,
    description: 'Lista de inscripciones de la capacitación',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { type: 'object' },
        },
        total: { type: 'number', example: 25 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 10 },
        totalPages: { type: 'number', example: 3 },
      },
    },
  })
  findByCapacitacion(
    @Param('capacitacionId', ParseIntPipe) capacitacionId: number,
    @Body() pagination?: PaginationDto,
  ) {
    return this.findByCapacitacionUseCase.execute(capacitacionId, pagination);
  }
}
