import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './infrastructure/shared/guards/jwt-auth.guard';
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
import { UsuariosModule } from './infrastructure/usuarios/usuarios.module';
import { IntentosModule } from './infrastructure/intentos/intentos.module';
import { TermsModule } from './infrastructure/terms/terms.module';
import { DashboardModule } from './infrastructure/dashboard/dashboard.module';
import { ReportsModule } from './infrastructure/reports/reports.module';
import { RolesModule } from './infrastructure/roles/roles.module';
import { EmpresasModule } from './infrastructure/empresas/empresas.module';
import { StorageModule } from './infrastructure/shared/storage/storage.module';

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
