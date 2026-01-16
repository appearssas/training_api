import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './infrastructure/shared/guards/jwt-auth.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
  AuthModule,
  CapacitacionesModule,
  PersonasModule,
  InscripcionesModule,
  DatabaseModule,
  MaterialesModule,
  StorageModule,
  IntentosModule,
  EvaluacionesModule,
  CertificadosModule,
  UsuariosModule,
  TermsModule,
  DashboardModule,
  ReportsModule,
  RolesModule,
  EmpresasModule,
  ResenasModule,
  DocumentosLegalesModule,
  GlobalExceptionFilter,
  CertificatesModule,
  PagosModule,
} from '@/infrastructure';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    StorageModule,
    AuthModule,
    CapacitacionesModule,
    MaterialesModule,
    InscripcionesModule,
    IntentosModule,
    EvaluacionesModule,
    CertificadosModule,
    PersonasModule,
    CertificatesModule,
    PagosModule,
    UsuariosModule,
    TermsModule,
    DashboardModule,
    ReportsModule,
    RolesModule,
    EmpresasModule,
    ResenasModule,
    DocumentosLegalesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
