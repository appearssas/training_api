import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Certificado } from '@/entities/certificados/certificado.entity';
import { ConfiguracionAlerta } from '@/entities/alertas/configuracion-alerta.entity';
import { AlertaVencimiento } from '@/entities/alertas/alerta-vencimiento.entity';
import { CertificatesController } from '@/infrastructure/certificates/certificates.controller';
import { CertificateVigencyHelper } from '@/application/certificates/helpers/certificate-vigency.helper';
import { CheckExpirationsCron } from '@/application/certificates/jobs/check-expirations.cron';
import { SendExpirationAlertsUseCase } from '@/application/certificates/use-cases/send-expiration-alerts.use-case';
import { GetExpiringCertificatesReportUseCase } from '@/application/certificates/use-cases/get-expiring-certificates-report.use-case';
import { EmailModule } from '@/infrastructure/email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Certificado,
      ConfiguracionAlerta,
      AlertaVencimiento,
    ]),
    EmailModule,
  ],
  controllers: [CertificatesController],
  providers: [
    CertificateVigencyHelper,
    CheckExpirationsCron,
    SendExpirationAlertsUseCase,
    GetExpiringCertificatesReportUseCase,
  ],
  exports: [CertificateVigencyHelper, CheckExpirationsCron],
})
export class CertificatesModule {}
