import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmpresasController } from './empresas.controller';
import { Empresa } from '@/entities/empresas/empresa.entity';
import { CapacitacionEmpresa } from '@/entities/empresas/capacitacion-empresa.entity';
import { Capacitacion } from '@/entities/capacitacion/capacitacion.entity';
import { EmpresasCapacitacionesService } from './empresas-capacitaciones.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Empresa, CapacitacionEmpresa, Capacitacion]),
  ],
  controllers: [EmpresasController],
  providers: [EmpresasCapacitacionesService],
  exports: [EmpresasCapacitacionesService],
})
export class EmpresasModule {}
