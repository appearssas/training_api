import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Inscripcion } from '../../entities/inscripcion/inscripcion.entity';
import { Certificado } from '../../entities/certificados/certificado.entity';
import { Capacitacion } from '../../entities/capacitacion/capacitacion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Inscripcion, Certificado, Capacitacion])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
