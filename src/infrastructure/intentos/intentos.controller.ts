import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
  Request,
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
import { GetUser } from '@/infrastructure/shared/auth/decorators/get-user.decorator';
import {
  StartIntentoUseCase,
  SaveAnswerUseCase,
  FinishIntentoUseCase,
  GetAttemptsUseCase,
} from '@/application/intentos/use-cases';
import { StartIntentoDto, SubmitAnswerDto } from '@/application/intentos/dto';
import { IntentoEvaluacion } from '@/entities/evaluaciones/intento-evaluacion.entity';

/**
 * Controlador para gestionar intentos de evaluación
 * Expone endpoints REST para iniciar, guardar respuestas y finalizar intentos
 * Documentado con Swagger para facilitar la integración
 */
@ApiTags('intentos-evaluacion')
@Controller('evaluaciones/:evaluacionId/intentos')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth('JWT-auth')
export class IntentosController {
  constructor(
    private readonly startIntentoUseCase: StartIntentoUseCase,
    private readonly saveAnswerUseCase: SaveAnswerUseCase,
    private readonly finishIntentoUseCase: FinishIntentoUseCase,
    private readonly getAttemptsUseCase: GetAttemptsUseCase,
  ) {}

  /**
   * Iniciar un nuevo intento de evaluación
   */
  @Post('start')
  @Roles('ALUMNO', 'ADMIN', 'CLIENTE', 'INSTRUCTOR', 'OPERADOR')
  @ApiOperation({
    summary: 'Iniciar un intento de evaluación',
    description:
      'Inicia un nuevo intento de evaluación para un estudiante. Valida que tenga intentos disponibles según la configuración de la evaluación.',
  })
  @ApiParam({
    name: 'evaluacionId',
    type: 'number',
    description: 'ID de la evaluación',
    example: 1,
  })
  @ApiBody({
    type: StartIntentoDto,
    description: 'Datos para iniciar el intento',
    examples: {
      ejemplo: {
        summary: 'Iniciar intento',
        value: {
          inscripcionId: 1,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Intento iniciado exitosamente',
    type: IntentoEvaluacion,
  })
  @ApiResponse({
    status: 400,
    description: 'No hay intentos disponibles o datos inválidos',
  })
  @ApiResponse({
    status: 404,
    description: 'Evaluación o inscripción no encontrada',
  })
  async startAttempt(
    @Param('evaluacionId', ParseIntPipe) evaluacionId: number,
    @Body() dto: StartIntentoDto,
    @GetUser() user: any,
  ): Promise<IntentoEvaluacion> {
    return this.startIntentoUseCase.execute(evaluacionId, dto);
  }

  /**
   * Guardar una respuesta del estudiante
   */
  @Post(':intentoId/respuestas')
  @Roles('ALUMNO', 'ADMIN', 'CLIENTE', 'INSTRUCTOR', 'OPERADOR')
  @ApiOperation({
    summary: 'Guardar una respuesta',
    description:
      'Guarda o actualiza una respuesta del estudiante durante el intento. Soporta auto-guardado.',
  })
  @ApiParam({
    name: 'evaluacionId',
    type: 'number',
    description: 'ID de la evaluación',
    example: 1,
  })
  @ApiParam({
    name: 'intentoId',
    type: 'number',
    description: 'ID del intento de evaluación',
    example: 1,
  })
  @ApiBody({
    type: SubmitAnswerDto,
    description: 'Datos de la respuesta',
    examples: {
      respuestaUnica: {
        summary: 'Respuesta única',
        value: {
          preguntaId: 1,
          opcionRespuestaId: 3,
        },
      },
      respuestaMultiple: {
        summary: 'Respuesta múltiple',
        value: {
          preguntaId: 2,
          opcionRespuestaIds: [1, 3, 5],
        },
      },
      respuestaAbierta: {
        summary: 'Respuesta abierta',
        value: {
          preguntaId: 3,
          textoRespuesta: 'Mi respuesta personalizada',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Respuesta guardada exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'El intento no está en progreso',
  })
  @ApiResponse({
    status: 404,
    description: 'Intento no encontrado',
  })
  async saveAnswer(
    @Param('evaluacionId', ParseIntPipe) evaluacionId: number,
    @Param('intentoId', ParseIntPipe) intentoId: number,
    @Body() dto: SubmitAnswerDto,
    @GetUser() user: any,
  ): Promise<{ message: string }> {
    await this.saveAnswerUseCase.execute(intentoId, dto);
    return { message: 'Respuesta guardada exitosamente' };
  }

  /**
   * Finalizar un intento de evaluación
   */
  @Post(':intentoId/finish')
  @Roles('ALUMNO', 'ADMIN', 'CLIENTE', 'INSTRUCTOR', 'OPERADOR')
  @ApiOperation({
    summary: 'Finalizar un intento de evaluación',
    description:
      'Finaliza un intento de evaluación, calcula el puntaje automáticamente y determina si el estudiante aprobó.',
  })
  @ApiParam({
    name: 'evaluacionId',
    type: 'number',
    description: 'ID de la evaluación',
    example: 1,
  })
  @ApiParam({
    name: 'intentoId',
    type: 'number',
    description: 'ID del intento de evaluación',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Intento finalizado exitosamente',
    type: IntentoEvaluacion,
  })
  @ApiResponse({
    status: 400,
    description: 'El intento no está en progreso',
  })
  @ApiResponse({
    status: 404,
    description: 'Intento no encontrado',
  })
  async finishAttempt(
    @Param('evaluacionId', ParseIntPipe) evaluacionId: number,
    @Param('intentoId', ParseIntPipe) intentoId: number,
    @GetUser() user: any,
  ): Promise<IntentoEvaluacion> {
    return this.finishIntentoUseCase.execute(intentoId);
  }

  /**
   * Obtener todos los intentos de un estudiante para una evaluación
   */
  @Get()
  @Roles('ALUMNO', 'ADMIN', 'CLIENTE', 'INSTRUCTOR', 'OPERADOR')
  @ApiOperation({
    summary: 'Obtener intentos de un estudiante',
    description:
      'Obtiene todos los intentos de un estudiante para una evaluación específica. Requiere inscripcionId como query parameter.',
  })
  @ApiParam({
    name: 'evaluacionId',
    type: 'number',
    description: 'ID de la evaluación',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de intentos',
    type: [IntentoEvaluacion],
  })
  async getAttempts(
    @Param('evaluacionId', ParseIntPipe) evaluacionId: number,
    @Request() req: any,
  ): Promise<IntentoEvaluacion[]> {
    // Obtener inscripcionId del query parameter
    const inscripcionId = parseInt(req.query.inscripcionId);
    if (!inscripcionId) {
      throw new Error('inscripcionId es requerido');
    }
    return this.getAttemptsUseCase.execute(evaluacionId, inscripcionId);
  }
}

