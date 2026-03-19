import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
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
  CertificateFormatsModule,
  UsuariosModule,
  TermsModule,
  DashboardModule,
  ReportsModule,
  RolesModule,
  EmpresasModule,
  ResenasModule,
  DocumentosLegalesModule,
  CatalogosModule,
  ConfiguracionSesionModule,
  AssistantModule,
  GlobalExceptionFilter,
  CertificatesModule,
  PagosModule,
  DbRetryInterceptor,
} from '@/infrastructure';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // BullMQ (Redis): solo si REDIS_ENABLED=true; si no, el bulk se ejecuta en síncrono
    ...(process.env.REDIS_ENABLED === 'true'
      ? [
          BullModule.forRootAsync({
            useFactory: (config: ConfigService) => ({
              connection: {
                host: config.get<string>('REDIS_HOST', 'localhost'),
                port: config.get<number>('REDIS_PORT', 6379),
                ...(config.get<string>('REDIS_PASSWORD') && {
                  password: config.get<string>('REDIS_PASSWORD'),
                }),
              },
            }),
            inject: [ConfigService],
          }),
        ]
      : []),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    DatabaseModule,
    StorageModule,
    AuthModule,
    CapacitacionesModule,
    MaterialesModule,
    InscripcionesModule,
    IntentosModule,
    EvaluacionesModule,
    CertificadosModule,
    CertificateFormatsModule,
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
    CatalogosModule,
    ConfiguracionSesionModule,
    AssistantModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: DbRetryInterceptor,
    },
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
