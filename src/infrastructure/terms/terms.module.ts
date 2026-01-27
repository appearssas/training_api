import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentoLegal } from '@/entities/documentos/documento-legal.entity';
import { AceptacionPolitica } from '@/entities/aceptaciones/aceptacion-politica.entity';
import { Usuario } from '@/entities/usuarios/usuario.entity';
import { TermsController } from './terms.controller';
import { AuthModule } from '../auth/auth.module';
import { AceptacionesRepositoryAdapter } from '../aceptaciones/aceptaciones.repository.adapter';
import { AceptarTerminosUseCase } from '@/application/aceptaciones/use-cases/aceptar-terminos.use-case';
import { VerificarAceptacionUseCase } from '@/application/aceptaciones/use-cases/verificar-aceptacion.use-case';
import { ObtenerDocumentosActivosUseCase } from '@/application/aceptaciones/use-cases/obtener-documentos-activos.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([DocumentoLegal, AceptacionPolitica, Usuario]),
    forwardRef(() => AuthModule), // Usar forwardRef para resolver dependencia circular
  ],
  controllers: [TermsController],
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
export class TermsModule {}
