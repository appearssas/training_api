import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvaluacionesController } from './evaluaciones.controller';
import { EvaluacionesRepositoryAdapter } from './evaluaciones.repository.adapter';
import { Evaluacion } from '@/entities/evaluaciones/evaluacion.entity';
import { Pregunta } from '@/entities/evaluaciones/pregunta.entity';
import { OpcionRespuesta } from '@/entities/evaluaciones/opcion-respuesta.entity';
import {
  FindOneEvaluacionUseCase,
  UpdateEvaluacionUseCase,
} from '@/application/evaluaciones/use-cases';

/**
 * Módulo de Evaluaciones
 * Registra controladores, casos de uso y adaptadores del repositorio
 * Sigue el principio de Inversión de Dependencias (SOLID)
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Evaluacion, Pregunta, OpcionRespuesta]),
  ],
  controllers: [EvaluacionesController],
  providers: [
    FindOneEvaluacionUseCase,
    UpdateEvaluacionUseCase,
    {
      provide: 'IEvaluacionesRepository',
      useClass: EvaluacionesRepositoryAdapter,
    },
  ],
  exports: [
    FindOneEvaluacionUseCase,
    UpdateEvaluacionUseCase,
  ],
})
export class EvaluacionesModule {}

