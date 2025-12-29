import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AceptacionesController } from './aceptaciones.controller';
import { AceptacionesRepositoryAdapter } from './aceptaciones.repository.adapter';
import { AceptarTerminosUseCase } from '@/application/aceptaciones/use-cases/aceptar-terminos.use-case';
import { VerificarAceptacionUseCase } from '@/application/aceptaciones/use-cases/verificar-aceptacion.use-case';
import { ObtenerDocumentosActivosUseCase } from '@/application/aceptaciones/use-cases/obtener-documentos-activos.use-case';
import { AceptacionPolitica } from '@/entities/aceptaciones/aceptacion-politica.entity';
import { DocumentoLegal } from '@/entities/documentos/documento-legal.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AceptacionPolitica, DocumentoLegal])],
  controllers: [AceptacionesController],
  providers: [
    {
      provide: 'IAceptacionesRepository',
      useClass: AceptacionesRepositoryAdapter,
    },
    AceptarTerminosUseCase,
    VerificarAceptacionUseCase,
    ObtenerDocumentosActivosUseCase,
  ],
  exports: ['IAceptacionesRepository', VerificarAceptacionUseCase],
})
export class AceptacionesModule {}
