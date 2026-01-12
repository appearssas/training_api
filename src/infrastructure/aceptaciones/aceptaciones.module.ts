import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AceptacionesRepositoryAdapter } from './aceptaciones.repository.adapter';
import { AceptarTerminosUseCase } from '@/application/aceptaciones/use-cases/aceptar-terminos.use-case';
import { VerificarAceptacionUseCase } from '@/application/aceptaciones/use-cases/verificar-aceptacion.use-case';
import { ObtenerDocumentosActivosUseCase } from '@/application/aceptaciones/use-cases/obtener-documentos-activos.use-case';
import { AceptacionPolitica } from '@/entities/aceptaciones/aceptacion-politica.entity';
import { DocumentoLegal } from '@/entities/documentos/documento-legal.entity';
import { Usuario } from '@/entities/usuarios/usuario.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AceptacionPolitica, DocumentoLegal, Usuario]),
  ],
  controllers: [],
  providers: [
    {
      provide: 'IAceptacionesRepository',
      useClass: AceptacionesRepositoryAdapter,
    },
    AceptarTerminosUseCase,
    VerificarAceptacionUseCase,
    ObtenerDocumentosActivosUseCase,
  ],
  exports: [
    'IAceptacionesRepository',
    VerificarAceptacionUseCase,
    AceptarTerminosUseCase,
    ObtenerDocumentosActivosUseCase,
  ],
})
export class AceptacionesModule {}
