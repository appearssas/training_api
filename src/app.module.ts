import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CapacitacionesModule } from './infrastructure/capacitaciones/capacitaciones.module';
import { MaterialesModule } from './infrastructure/materiales/materiales.module';
import { EvaluacionesModule } from './infrastructure/evaluaciones/evaluaciones.module';
import { InscripcionesModule } from './infrastructure/inscripciones/inscripciones.module';
import { CertificadosModule } from './infrastructure/certificados/certificados.module';
import { GlobalExceptionFilter } from '@/infrastructure/shared/filters/global-exception.filter';
import { AuthModule } from './infrastructure/auth/auth.module';
import { DatabaseModule } from './infrastructure/shared/database/database.module';
import { PersonasModule } from './infrastructure/personas/personas.module';
import { CertificatesModule } from './infrastructure/certificates/certificates.module';
import { PagosModule } from './infrastructure/pagos/pagos.module';
import { AceptacionesModule } from './infrastructure/aceptaciones/aceptaciones.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    CapacitacionesModule,
    MaterialesModule,
    EvaluacionesModule,
    InscripcionesModule,
    CertificadosModule,
    PersonasModule,
    CertificatesModule,
    PagosModule,
    AceptacionesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
