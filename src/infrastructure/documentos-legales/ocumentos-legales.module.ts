import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentosLegalesController } from './documentos-legales.controller';
import { DocumentosLegalesRepositoryAdapter } from './documentos-legales.repository.adapter';
import { DocumentoLegal } from '@/entities/documentos/documento-legal.entity';
import { Usuario } from '@/entities/usuarios/usuario.entity';
import {
  CreateDocumentoLegalUseCase,
  FindAllDocumentosLegalesUseCase,
  FindOneDocumentoLegalUseCase,
  UpdateDocumentoLegalUseCase,
  RemoveDocumentoLegalUseCase,
} from '@/application/documentos-legales/use-cases';

@Module({
  controllers: [DocumentosLegalesController],
  imports: [TypeOrmModule.forFeature([DocumentoLegal, Usuario])],
  providers: [
    CreateDocumentoLegalUseCase,
    FindAllDocumentosLegalesUseCase,
    FindOneDocumentoLegalUseCase,
    UpdateDocumentoLegalUseCase,
    RemoveDocumentoLegalUseCase,
    {
      provide: 'IDocumentosLegalesRepository',
      useClass: DocumentosLegalesRepositoryAdapter,
    },
  ],
  exports: [
    CreateDocumentoLegalUseCase,
    FindAllDocumentosLegalesUseCase,
    FindOneDocumentoLegalUseCase,
    UpdateDocumentoLegalUseCase,
    RemoveDocumentoLegalUseCase,
  ],
})
export class DocumentosLegalesModule {}
