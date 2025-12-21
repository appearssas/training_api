import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CapacitacionesController } from './capacitaciones.controller';
import { CreateCapacitacionUseCase } from '@/application/capacitaciones/use-cases/create-capacitacion.use-case';
import { FindAllCapacitacionesUseCase } from '@/application/capacitaciones/use-cases/find-all-capacitaciones.use-case';
import { FindOneCapacitacionUseCase } from '@/application/capacitaciones/use-cases/find-one-capacitacion.use-case';
import { UpdateCapacitacionUseCase } from '@/application/capacitaciones/use-cases/update-capacitacion.use-case';
import { RemoveCapacitacionUseCase } from '@/application/capacitaciones/use-cases/remove-capacitacion.use-case';
import { LinkEvaluacionUseCase } from '@/application/capacitaciones/use-cases/link-evaluacion.use-case';
import { ToggleStatusUseCase } from '@/application/capacitaciones/use-cases/toggle-status.use-case';
import { CapacitacionesRepositoryAdapter } from './capacitaciones.repository.adapter';
import { Capacitacion } from '@/entities/capacitacion/capacitacion.entity';
import { Evaluacion } from '@/entities/evaluaciones/evaluacion.entity';
import { Pregunta } from '@/entities/evaluaciones/pregunta.entity';
import { OpcionRespuesta } from '@/entities/evaluaciones/opcion-respuesta.entity';
import { TipoPregunta } from '@/entities/catalogos/tipo-pregunta.entity';
import { Certificado } from '@/entities/certificados/certificado.entity';
import { Inscripcion } from '@/entities/inscripcion/inscripcion.entity';
import { EvaluacionValidatorService } from '../shared/services/evaluacion-validator.service';
import { CertificadoValidatorService } from '../shared/services/certificado-validator.service';

@Module({
  controllers: [CapacitacionesController],
  providers: [
    CreateCapacitacionUseCase,
    FindAllCapacitacionesUseCase,
    FindOneCapacitacionUseCase,
    UpdateCapacitacionUseCase,
    RemoveCapacitacionUseCase,
    LinkEvaluacionUseCase,
    ToggleStatusUseCase,
    EvaluacionValidatorService,
    CertificadoValidatorService,
    {
      provide: 'ICapacitacionesRepository',
      useClass: CapacitacionesRepositoryAdapter,
    },
  ],
  imports: [
    TypeOrmModule.forFeature([
      Capacitacion,
      Evaluacion,
      Pregunta,
      OpcionRespuesta,
      TipoPregunta,
      Certificado,
      Inscripcion,
    ]),
  ],
  exports: [
    CreateCapacitacionUseCase,
    FindAllCapacitacionesUseCase,
    FindOneCapacitacionUseCase,
    UpdateCapacitacionUseCase,
    RemoveCapacitacionUseCase,
    LinkEvaluacionUseCase,
    ToggleStatusUseCase,
    EvaluacionValidatorService,
    CertificadoValidatorService,
  ],
})
export class CapacitacionesModule {}
