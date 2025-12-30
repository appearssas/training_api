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
import { S3Service } from '../shared/services/s3.service';
import { ConfigService } from '@nestjs/config';

@Module({
  controllers: [MaterialesController],
  providers: [
    CreateMaterialUseCase,
    UpdateMaterialUseCase,
    RemoveMaterialUseCase,
    FindMaterialsByCapacitacionUseCase,
    FindOneMaterialUseCase,
    VideoUrlValidatorService,
    {
      provide: S3Service,
      useFactory: (configService: ConfigService) => {
        // Solo crear S3Service si las variables de entorno están configuradas
        const bucketName = configService.get<string>('AWS_S3_BUCKET_NAME');
        const accessKeyId = configService.get<string>('AWS_ACCESS_KEY_ID');
        const secretAccessKey = configService.get<string>('AWS_SECRET_ACCESS_KEY');
        
        if (bucketName && accessKeyId && secretAccessKey) {
          try {
            return new S3Service(configService);
          } catch (error) {
            console.warn('⚠️ S3Service no se pudo inicializar, usando almacenamiento local:', error);
            return null;
          }
        }
        return null;
      },
      inject: [ConfigService],
    },
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

