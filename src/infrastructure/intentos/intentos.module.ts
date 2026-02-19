import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntentosController } from './intentos.controller';
import { IntentosRepositoryAdapter } from './intentos.repository.adapter';
import { IntentoEvaluacion } from '@/entities/evaluaciones/intento-evaluacion.entity';
import { RespuestaEstudiante } from '@/entities/evaluaciones/respuesta-estudiante.entity';
import { RespuestaMultiple } from '@/entities/evaluaciones/respuesta-multiple.entity';
import { Evaluacion } from '@/entities/evaluaciones/evaluacion.entity';
import { Inscripcion } from '@/entities/inscripcion/inscripcion.entity';
import { Pregunta } from '@/entities/evaluaciones/pregunta.entity';
import { OpcionRespuesta } from '@/entities/evaluaciones/opcion-respuesta.entity';
import {
  StartIntentoUseCase,
  SaveAnswerUseCase,
  FinishIntentoUseCase,
  GetAttemptsUseCase,
} from '@/application/intentos/use-cases';
import { EvaluationScoringService } from '@/infrastructure/shared/services/evaluation-scoring.service';
import { EvaluacionesModule } from '../evaluaciones/evaluaciones.module';
import { InscripcionesModule } from '../inscripciones/inscripciones.module';
import { CertificadosModule } from '../certificados/certificados.module';
import { Capacitacion } from '@/entities/capacitacion/capacitacion.entity';
import { TipoCapacitacion } from '@/entities/catalogos/tipo-capacitacion.entity';
import { Certificado } from '@/entities/certificados/certificado.entity';

/**
 * Módulo de Intentos de Evaluación
 * Registra controladores, casos de uso y adaptadores del repositorio
 * Sigue el principio de Inversión de Dependencias (SOLID)
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      IntentoEvaluacion,
      RespuestaEstudiante,
      RespuestaMultiple,
      Evaluacion,
      Inscripcion,
      Pregunta,
      OpcionRespuesta,
      Capacitacion,
      TipoCapacitacion,
      Certificado,
    ]),
    EvaluacionesModule,
    InscripcionesModule,
    CertificadosModule,
  ],
  controllers: [IntentosController],
  providers: [
    StartIntentoUseCase,
    SaveAnswerUseCase,
    FinishIntentoUseCase,
    GetAttemptsUseCase,
    EvaluationScoringService,
    {
      provide: 'IIntentosRepository',
      useClass: IntentosRepositoryAdapter,
    },
  ],
  exports: [
    StartIntentoUseCase,
    SaveAnswerUseCase,
    FinishIntentoUseCase,
    GetAttemptsUseCase,
  ],
})
export class IntentosModule {}
