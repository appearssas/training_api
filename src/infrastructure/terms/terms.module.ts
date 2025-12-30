import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentoLegal } from '@/entities/documentos/documento-legal.entity';
import { AceptacionPolitica } from '@/entities/aceptaciones/aceptacion-politica.entity';
import { Usuario } from '@/entities/usuarios/usuario.entity';
import { TermsController } from './terms.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DocumentoLegal, AceptacionPolitica, Usuario])],
  controllers: [TermsController],
})
export class TermsModule {}
