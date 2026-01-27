import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageService } from '../services/storage.service';
import { S3Service } from '../services/s3.service';

/**
 * Módulo global para servicios de almacenamiento
 * Proporciona StorageService y S3Service de forma centralizada
 */
@Global()
@Module({
  providers: [
    {
      provide: S3Service,
      useFactory: (configService: ConfigService): S3Service | null => {
        // Solo crear S3Service si las variables de entorno están configuradas
        const bucketName = configService.get<string>('AWS_S3_BUCKET_NAME');
        const accessKeyId = configService.get<string>('AWS_ACCESS_KEY_ID');
        const secretAccessKey = configService.get<string>('AWS_SECRET_ACCESS_KEY');

        console.log('\n🔍 StorageModule - Verificando configuración S3:');
        console.log(`   bucketName: ${bucketName ? `✅ Configurado (${bucketName})` : '❌ No configurado'}`);
        console.log(`   accessKeyId: ${accessKeyId ? `✅ Configurado (${accessKeyId.substring(0, 4)}...)` : '❌ No configurado'}`);
        console.log(`   secretAccessKey: ${secretAccessKey ? `✅ Configurado (${secretAccessKey.substring(0, 4)}...)` : '❌ No configurado'}`);

        if (bucketName && accessKeyId && secretAccessKey) {
          try {
            console.log('✅ Creando instancia de S3Service...');
            const s3Service = new S3Service(configService);
            console.log('✅ S3Service creado exitosamente\n');
            return s3Service;
          } catch (error) {
            console.error('❌ Error al crear S3Service:', error);
            console.warn('⚠️ Usando almacenamiento local\n');
            return null;
          }
        }
        console.log('⚠️ Variables de S3 no configuradas completamente, S3Service será null\n');
        return null;
      },
      inject: [ConfigService],
    },
    StorageService,
  ],
  exports: [StorageService, S3Service],
})
export class StorageModule {}

