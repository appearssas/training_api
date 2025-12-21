import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThan, IsNull, Not } from 'typeorm';
import { Certificado } from '@/entities/certificados/certificado.entity';
import { ConfiguracionAlerta } from '@/entities/alertas/configuracion-alerta.entity';
import { AlertaVencimiento } from '@/entities/alertas/alerta-vencimiento.entity';
import { SendExpirationAlertsUseCase } from '../use-cases/send-expiration-alerts.use-case';
import { CertificateVigencyHelper } from '../helpers/certificate-vigency.helper';

@Injectable()
export class CheckExpirationsCron {
  private readonly logger = new Logger(CheckExpirationsCron.name);

  constructor(
    @InjectRepository(Certificado)
    private readonly certificadoRepository: Repository<Certificado>,
    @InjectRepository(ConfiguracionAlerta)
    private readonly configAlertaRepository: Repository<ConfiguracionAlerta>,
    @InjectRepository(AlertaVencimiento)
    private readonly alertaRepository: Repository<AlertaVencimiento>,
    private readonly sendAlertsUseCase: SendExpirationAlertsUseCase,
    private readonly vigencyHelper: CertificateVigencyHelper,
  ) {}

  /**
   * Tarea programada que se ejecuta diariamente a las 6:00 AM
   * para detectar y enviar alertas de certificados próximos a vencer
   */
  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async handleCron() {
    this.logger.log('🔍 Iniciando verificación de certificados próximos a vencer...');

    try {
      // Obtener configuraciones activas
      const configuraciones = await this.configAlertaRepository.find({
        where: { activo: true },
        order: { diasAntesVencimiento: 'DESC' },
      });

      if (configuraciones.length === 0) {
        this.logger.warn('⚠️  No hay configuraciones de alerta activas');
        return;
      }

      this.logger.log(
        `📋 Configuraciones activas: ${configuraciones.map((c) => `${c.diasAntesVencimiento} días`).join(', ')}`,
      );

      let totalAlertsCreated = 0;

      // Por cada configuración, buscar certificados que cumplan la condición
      for (const config of configuraciones) {
        const alertasCreadas = await this.processConfiguration(config);
        totalAlertsCreated += alertasCreadas;
      }

      this.logger.log(
        `✅ Verificación completada. Total de alertas creadas: ${totalAlertsCreated}`,
      );
    } catch (error) {
      this.logger.error('❌ Error en tarea programada de verificación:', error);
    }
  }

  /**
   * Procesa una configuración de alerta específica
   */
  private async processConfiguration(
    config: ConfiguracionAlerta,
  ): Promise<number> {
    const { diasAntesVencimiento } = config;

    // Calcular fecha objetivo
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechaObjetivo = new Date(hoy);
    fechaObjetivo.setDate(fechaObjetivo.getDate() + diasAntesVencimiento);

    this.logger.log(
      `🔎 Buscando certificados que vencen el ${fechaObjetivo.toISOString().split('T')[0]} (${diasAntesVencimiento} días)`,
    );

    // Buscar certificados activos que vencen en la fecha objetivo
    const certificados = await this.certificadoRepository.find({
      where: {
        fechaVencimiento: LessThanOrEqual(fechaObjetivo),
        activo: true,
      },
      relations: [
        'inscripcion',
        'inscripcion.alumno',
        'inscripcion.alumno.persona',
        'inscripcion.capacitacion',
      ],
    });

    let alertasCreadas = 0;

    for (const certificado of certificados) {
      // Verificar que realmente corresponde a esta configuración
      const diasRestantes =
        this.vigencyHelper.calculateDaysUntilExpiration(
          certificado.fechaVencimiento,
        );

      if (diasRestantes !== diasAntesVencimiento) {
        continue; // No es el día exacto para esta configuración
      }

      // Verificar si ya se envió alerta para este certificado y configuración
      const alertaExistente = await this.alertaRepository.findOne({
        where: {
          certificado: { id: certificado.id },
          diasRestantes: diasAntesVencimiento,
        },
      });

      if (alertaExistente) {
        this.logger.debug(
          `⏭️  Alerta ya enviada para certificado ${certificado.numeroCertificado} (${diasAntesVencimiento} días)`,
        );
        continue;
      }

      // Crear registro de alerta
      const alerta = this.alertaRepository.create({
        certificado,
        diasRestantes: diasAntesVencimiento,
        fechaVencimiento: certificado.fechaVencimiento,
        enviado: false,
      });

      await this.alertaRepository.save(alerta);

      // Enviar email
      try {
        await this.sendAlertsUseCase.execute(certificado, diasAntesVencimiento);

        // Marcar como enviado
        alerta.enviado = true;
        await this.alertaRepository.save(alerta);

        this.logger.log(
          `📧 Alerta enviada para certificado ${certificado.numeroCertificado} (${diasAntesVencimiento} días restantes)`,
        );

        alertasCreadas++;
      } catch (error) {
        this.logger.error(
          `❌ Error al enviar alerta para certificado ${certificado.numeroCertificado}:`,
          error,
        );
      }
    }

    return alertasCreadas;
  }

  /**
   * Método manual para forzar la ejecución (útil para testing)
   */
  async executeManually() {
    this.logger.log('🔧 Ejecución manual iniciada');
    await this.handleCron();
  }
}
