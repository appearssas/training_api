import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgresoLeccion } from '@/entities/progreso/progreso-leccion.entity';
import { ProgresoLeccionRepositoryAdapter } from './progreso-leccion.repository.adapter';

@Module({
  imports: [TypeOrmModule.forFeature([ProgresoLeccion])],
  providers: [
    {
      provide: 'IProgresoLeccionRepository',
      useClass: ProgresoLeccionRepositoryAdapter,
    },
  ],
  exports: ['IProgresoLeccionRepository'],
})
export class ProgresoModule {}
