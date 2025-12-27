import { Injectable, Logger } from '@nestjs/common';
import { Certificado } from '@/entities/certificados/certificado.entity';
import { EmailService } from '@/infrastructure/email/email.service';

@Injectable()
export class SendExpirationAlertsUseCase {
  private readonly logger = new Logger(SendExpirationAlertsUseCase.name);

  constructor(private readonly emailService: EmailService) {}

  async execute(
    certificado: Certificado,
    diasRestantes: number,
  ): Promise<void> {
    // Obtener datos del alumno (conductor)
    if (!certificado.inscripcion) {
      this.logger.warn(
        `⚠️  No se puede enviar alerta: certificado ${certificado.numeroCertificado} sin inscripción`,
      );
      return;
    }

    const alumno = (certificado.inscripcion as any).alumno;
    const persona = alumno?.persona;

    if (!persona?.email) {
      this.logger.warn(
        `⚠️  No se puede enviar alerta: certificado ${certificado.numeroCertificado} sin email de alumno`,
      );
      return;
    }

    // TODO: Obtener representante de la empresa (si es inscripción institucional)
    // Por ahora solo enviaremos al conductor

    try {
      await this.emailService.sendExpirationAlert(
        persona.email,
        `${persona.nombres} ${persona.apellidos}`,
        certificado,
        diasRestantes,
      );

      this.logger.log(
        `✅ Alerta enviada a ${persona.email} para certificado ${certificado.numeroCertificado}`,
      );
    } catch (error) {
      this.logger.error(
        `Error al enviar alerta para certificado ${certificado.numeroCertificado}:`,
        error,
      );
      throw error;
    }
  }
}
