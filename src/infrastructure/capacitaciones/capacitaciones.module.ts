import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CapacitacionesController } from './capacitaciones.controller';
import { CreateCapacitacionUseCase } from '@/application/capacitaciones/use-cases/create-capacitacion.use-case';
import { FindAllCapacitacionesUseCase } from '@/application/capacitaciones/use-cases/find-all-capacitaciones.use-case';
import { FindOneCapacitacionUseCase } from '@/application/capacitaciones/use-cases/find-one-capacitacion.use-case';
import { UpdateCapacitacionUseCase } from '@/application/capacitaciones/use-cases/update-capacitacion.use-case';
import { RemoveCapacitacionUseCase } from '@/application/capacitaciones/use-cases/remove-capacitacion.use-case';
import { CapacitacionesRepositoryAdapter } from './capacitaciones.repository.adapter';
import { Capacitacion } from '@/entities/capacitacion.entity';

@Module({
  controllers: [CapacitacionesController],
  providers: [
    CreateCapacitacionUseCase,
    FindAllCapacitacionesUseCase,
    FindOneCapacitacionUseCase,
    UpdateCapacitacionUseCase,
    RemoveCapacitacionUseCase,
    {
      provide: 'ICapacitacionesRepository',
      useClass: CapacitacionesRepositoryAdapter,
    },
    DataSource,
  ],
  imports: [TypeOrmModule.forFeature([Capacitacion])],
  exports: [
    CreateCapacitacionUseCase,
    FindAllCapacitacionesUseCase,
    FindOneCapacitacionUseCase,
    UpdateCapacitacionUseCase,
    RemoveCapacitacionUseCase,
  ],
})
export class CapacitacionesModule {}
