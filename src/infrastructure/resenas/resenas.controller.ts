import {
  Controller,
  Get,
  Post,
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
import { CreateResenaDto, ResenaResponseDto } from '@/application/resenas/dto';
import { CreateResenaUseCase } from '@/application/resenas/use-cases/create-resena.use-case';
import { FindResenaByInscripcionUseCase } from '@/application/resenas/use-cases/find-resena-by-inscripcion.use-case';

/**
 * Controlador de Reseñas
 * Gestiona las operaciones relacionadas con reseñas de capacitaciones
 */
@ApiTags('resenas')
@Controller('resenas')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ResenasController {
  constructor(
    private readonly createResenaUseCase: CreateResenaUseCase,
    private readonly findResenaByInscripcionUseCase: FindResenaByInscripcionUseCase,
  ) {}

  @Post()
  @Roles('ADMIN', 'ALUMNO', 'CLIENTE')
  @ApiOperation({
    summary: 'Crear una nueva reseña',
    description:
      'Crea una reseña para una capacitación completada. Solo se permite una reseña por inscripción. ' +
      'La calificación debe estar entre 1 y 5 estrellas. ADMIN, ALUMNO y CLIENTE pueden crear reseñas.',
  })
  @ApiBody({ type: CreateResenaDto })
  @ApiResponse({
    status: 201,
    description: 'Reseña creada exitosamente',
    type: ResenaResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o inscripción no encontrada',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe una reseña para esta inscripción',
  })
  async create(@Body() createResenaDto: CreateResenaDto) {
    const resena = await this.createResenaUseCase.execute(createResenaDto);
    // Mapear la entidad Resena a ResenaResponseDto para el frontend
    return {
      id: resena.id,
      inscripcionId: resena.inscripcion?.id || createResenaDto.inscripcionId,
      calificacion: resena.calificacion,
      comentario: resena.comentario,
      fechaCreacion: resena.fechaCreacion,
      activo: resena.activo,
    };
  }

  @Get('inscripcion/:inscripcionId')
  @Roles('ADMIN', 'ALUMNO', 'CLIENTE', 'INSTRUCTOR', 'OPERADOR')
  @ApiOperation({
    summary: 'Obtener reseña por inscripción',
    description:
      'Obtiene la reseña asociada a una inscripción específica. ' +
      'Si no existe, retorna null. ADMIN, ALUMNO, CLIENTE, INSTRUCTOR y OPERADOR pueden consultar reseñas.',
  })
  @ApiParam({
    name: 'inscripcionId',
    description: 'ID de la inscripción',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Reseña encontrada',
    type: ResenaResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Reseña no encontrada',
  })
  async findByInscripcion(
    @Param('inscripcionId', ParseIntPipe) inscripcionId: number,
  ) {
    const resena =
      await this.findResenaByInscripcionUseCase.execute(inscripcionId);
    if (!resena) {
      return null;
    }
    // Mapear la entidad Resena a ResenaResponseDto para el frontend
    return {
      id: resena.id,
      inscripcionId: resena.inscripcion?.id || inscripcionId,
      calificacion: resena.calificacion,
      comentario: resena.comentario,
      fechaCreacion: resena.fechaCreacion,
      activo: resena.activo,
    };
  }
}
