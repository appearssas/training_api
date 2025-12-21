import { Controller, Get, Param, ParseIntPipe, Patch, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { FindOneEvaluacionUseCase, UpdateEvaluacionUseCase } from '@/application/evaluaciones/use-cases';
import { UpdateEvaluacionDto } from '@/application/evaluaciones/dto';
import { Evaluacion } from '@/entities/evaluaciones/evaluacion.entity';

/**
 * Controlador para gestionar evaluaciones
 * Expone endpoints REST para operaciones CRUD de evaluaciones
 * Documentado con Swagger para facilitar la integración
 */
@ApiTags('evaluaciones')
@Controller('evaluaciones')
export class EvaluacionesController {
  constructor(
    private readonly findOneEvaluacionUseCase: FindOneEvaluacionUseCase,
    private readonly updateEvaluacionUseCase: UpdateEvaluacionUseCase,
  ) {}

  /**
   * Obtiene una evaluación por ID con sus preguntas y opciones
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Obtener una evaluación por ID',
    description: 'Retorna una evaluación completa con todas sus preguntas y opciones de respuesta ordenadas',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID de la evaluación a obtener',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Evaluación encontrada exitosamente',
    type: Evaluacion,
  })
  @ApiResponse({
    status: 404,
    description: 'Evaluación no encontrada',
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Evaluacion> {
    return this.findOneEvaluacionUseCase.execute(id);
  }

  /**
   * Actualiza una evaluación existente
   * Permite actualizar la evaluación, sus preguntas y opciones de respuesta
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar una evaluación',
    description:
      'Actualiza una evaluación existente. Permite modificar los datos de la evaluación, ' +
      'sus preguntas y opciones de respuesta. Las preguntas y opciones se sincronizan: ' +
      'se crean las nuevas, se actualizan las existentes y se eliminan las que ya no están en la lista.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID de la evaluación a actualizar',
    example: 1,
  })
  @ApiBody({
    type: UpdateEvaluacionDto,
    description: 'Datos para actualizar la evaluación',
    examples: {
      actualizarBasico: {
        summary: 'Actualizar solo datos básicos',
        value: {
          titulo: 'Evaluación Actualizada',
          descripcion: 'Nueva descripción',
          tiempoLimiteMinutos: 90,
        },
      },
      actualizarCompleto: {
        summary: 'Actualizar con preguntas y opciones',
        value: {
          titulo: 'Evaluación Actualizada',
          preguntas: [
            {
              id: 1, // Si tiene id, se actualiza; si no, se crea nueva
              tipoPreguntaId: 1,
              enunciado: 'Pregunta actualizada',
              opciones: [
                {
                  id: 1, // Si tiene id, se actualiza; si no, se crea nueva
                  texto: 'Opción actualizada',
                  esCorrecta: true,
                },
              ],
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Evaluación actualizada exitosamente',
    type: Evaluacion,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o validación fallida',
  })
  @ApiResponse({
    status: 404,
    description: 'Evaluación no encontrada',
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEvaluacionDto: UpdateEvaluacionDto,
  ): Promise<Evaluacion> {
    return this.updateEvaluacionUseCase.execute(id, updateEvaluacionDto);
  }
}

