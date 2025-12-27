import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CapacitacionesModule } from './infrastructure/capacitaciones/capacitaciones.module';
import { GlobalExceptionFilter } from '@/infrastructure/shared/filters/global-exception.filter';
import { AuthModule } from './infrastructure/auth/auth.module';
import { DatabaseModule } from './infrastructure/shared/database/database.module';
import { CertificatesModule } from './infrastructure/certificates/certificates.module';
import { TermsModule } from './infrastructure/terms/terms.module';
import { DashboardModule } from './infrastructure/dashboard/dashboard.module';
import { ReportsModule } from './infrastructure/reports/reports.module';

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
    CertificatesModule,
    TermsModule,
    DashboardModule,
    ReportsModule,
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
