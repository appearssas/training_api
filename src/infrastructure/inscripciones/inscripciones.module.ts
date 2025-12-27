import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InscripcionesController } from './inscripciones.controller';
import { CreateInscripcionUseCase } from '@/application/inscripciones/use-cases/create-inscripcion.use-case';
import { FindAllInscripcionesUseCase } from '@/application/inscripciones/use-cases/find-all-inscripciones.use-case';
import { FindOneInscripcionUseCase } from '@/application/inscripciones/use-cases/find-one-inscripcion.use-case';
import { UpdateInscripcionUseCase } from '@/application/inscripciones/use-cases/update-inscripcion.use-case';
import { RemoveInscripcionUseCase } from '@/application/inscripciones/use-cases/remove-inscripcion.use-case';
import { FindByEstudianteUseCase } from '@/application/inscripciones/use-cases/find-by-estudiante.use-case';
import { FindByCapacitacionUseCase } from '@/application/inscripciones/use-cases/find-by-capacitacion.use-case';
import { InscripcionesRepositoryAdapter } from './inscripciones.repository.adapter';
import { Inscripcion } from '@/entities/inscripcion/inscripcion.entity';
import { Capacitacion } from '@/entities/capacitacion/capacitacion.entity';
import { Persona } from '@/entities/persona/persona.entity';
import { Pago } from '@/entities/pagos/pago.entity';
import { InscripcionValidatorService } from '../shared/services/inscripcion-validator.service';

@Module({
  controllers: [InscripcionesController],
  providers: [
    CreateInscripcionUseCase,
    FindAllInscripcionesUseCase,
    FindOneInscripcionUseCase,
    UpdateInscripcionUseCase,
    RemoveInscripcionUseCase,
    FindByEstudianteUseCase,
    FindByCapacitacionUseCase,
    InscripcionValidatorService,
    {
      provide: 'IInscripcionesRepository',
      useClass: InscripcionesRepositoryAdapter,
    },
  ],
  imports: [
    TypeOrmModule.forFeature([Inscripcion, Capacitacion, Persona, Pago]),
  ],
  exports: [
    CreateInscripcionUseCase,
    FindAllInscripcionesUseCase,
    FindOneInscripcionUseCase,
    UpdateInscripcionUseCase,
    RemoveInscripcionUseCase,
    FindByEstudianteUseCase,
    FindByCapacitacionUseCase,
    InscripcionValidatorService,
    {
      provide: 'IInscripcionesRepository',
      useClass: InscripcionesRepositoryAdapter,
    },
  ],
})
export class InscripcionesModule {}
