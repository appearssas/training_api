import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Capacitacion } from '@/entities/capacitacion/capacitacion.entity';
import { Inscripcion } from '@/entities/inscripcion/inscripcion.entity';
import { Certificado } from '@/entities/certificados/certificado.entity';
import { Evaluacion } from '@/entities/evaluaciones/evaluacion.entity';
import { Resena } from '@/entities/resenas/resena.entity';
import { IntentoEvaluacion } from '@/entities/evaluaciones/intento-evaluacion.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Capacitacion,
      Inscripcion,
      Certificado,
      Evaluacion,
      Resena,
      IntentoEvaluacion,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
