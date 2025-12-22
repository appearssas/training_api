import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaterialesController } from './materiales.controller';
import { CreateMaterialUseCase } from '@/application/materiales/use-cases/create-material.use-case';
import { UpdateMaterialUseCase } from '@/application/materiales/use-cases/update-material.use-case';
import { RemoveMaterialUseCase } from '@/application/materiales/use-cases/remove-material.use-case';
import { FindMaterialsByCapacitacionUseCase } from '@/application/materiales/use-cases/find-materials-by-capacitacion.use-case';
import { FindOneMaterialUseCase } from '@/application/materiales/use-cases/find-one-material.use-case';
import { MaterialesRepositoryAdapter } from './materiales.repository.adapter';
import { MaterialCapacitacion } from '@/entities/materiales/material-capacitacion.entity';
import { TipoMaterial } from '@/entities/catalogos/tipo-material.entity';
import { VideoUrlValidatorService } from '../shared/services/video-url-validator.service';
import { StorageService } from '../shared/services/storage.service';

@Module({
  controllers: [MaterialesController],
  providers: [
    CreateMaterialUseCase,
    UpdateMaterialUseCase,
    RemoveMaterialUseCase,
    FindMaterialsByCapacitacionUseCase,
    FindOneMaterialUseCase,
    VideoUrlValidatorService,
    StorageService,
    {
      provide: 'IMaterialesRepository',
      useClass: MaterialesRepositoryAdapter,
    },
  ],
  imports: [
    TypeOrmModule.forFeature([MaterialCapacitacion, TipoMaterial]),
  ],
  exports: [
    CreateMaterialUseCase,
    UpdateMaterialUseCase,
    RemoveMaterialUseCase,
    FindMaterialsByCapacitacionUseCase,
    FindOneMaterialUseCase,
    VideoUrlValidatorService,
    StorageService,
  ],
})
export class MaterialesModule {}

