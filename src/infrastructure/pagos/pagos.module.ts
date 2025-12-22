import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PagosController } from './pagos.controller';
import { PagosRepositoryAdapter } from './pagos.repository.adapter';
import { CreatePagoUseCase } from '@/application/pagos/use-cases/create-pago.use-case';
import { HabilitarConductorUseCase } from '@/application/pagos/use-cases/habilitar-conductor.use-case';
import { Pago } from '@/entities/pagos/pago.entity';
import { PersonasModule } from '../personas/personas.module';

@Module({
  imports: [TypeOrmModule.forFeature([Pago]), PersonasModule],
  controllers: [PagosController],
  providers: [
    {
      provide: 'IPagosRepository',
      useClass: PagosRepositoryAdapter,
    },
    CreatePagoUseCase,
    HabilitarConductorUseCase,
  ],
  exports: ['IPagosRepository'],
})
export class PagosModule {}

