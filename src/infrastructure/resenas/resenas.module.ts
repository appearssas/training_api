import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResenasController } from './resenas.controller';
import { CreateResenaUseCase } from '@/application/resenas/use-cases/create-resena.use-case';
import { FindResenaByInscripcionUseCase } from '@/application/resenas/use-cases/find-resena-by-inscripcion.use-case';
import { ResenasRepositoryAdapter } from './resenas.repository.adapter';
import { Resena } from '@/entities/resenas/resena.entity';
import { Inscripcion } from '@/entities/inscripcion/inscripcion.entity';
import { InscripcionesModule } from '../inscripciones/inscripciones.module';

@Module({
  controllers: [ResenasController],
  providers: [
    CreateResenaUseCase,
    FindResenaByInscripcionUseCase,
    {
      provide: 'IResenasRepository',
      useClass: ResenasRepositoryAdapter,
    },
  ],
  imports: [
    TypeOrmModule.forFeature([Resena, Inscripcion]),
    InscripcionesModule,
  ],
  exports: [
    CreateResenaUseCase,
    FindResenaByInscripcionUseCase,
    {
      provide: 'IResenasRepository',
      useClass: ResenasRepositoryAdapter,
    },
  ],
})
export class ResenasModule {}
