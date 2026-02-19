import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnteCertificador } from '@/entities/catalogos/ente-certificador.entity';
import { Representante } from '@/entities/catalogos/representante.entity';
import { Instructor } from '@/entities/instructores/instructor.entity';
import { EntesCertificadoresController } from './entes-certificadores.controller';
import { EntesCertificadoresService } from './entes-certificadores.service';
import { EntesCertificadoresRepresentantesController } from './entes-certificadores-representantes.controller';
import { InstructoresCatalogosController } from './instructores-catalogos.controller';
import { InstructoresCatalogosService } from './instructores-catalogos.service';
import { RepresentantesService } from './representantes.service';
import { StorageModule } from '@/infrastructure/shared/storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EnteCertificador, Instructor, Representante]),
    StorageModule,
  ],
  controllers: [
    EntesCertificadoresController,
    EntesCertificadoresRepresentantesController,
    InstructoresCatalogosController,
  ],
  providers: [
    EntesCertificadoresService,
    InstructoresCatalogosService,
    RepresentantesService,
  ],
  exports: [
    EntesCertificadoresService,
    InstructoresCatalogosService,
    RepresentantesService,
  ],
})
export class CatalogosModule {}
