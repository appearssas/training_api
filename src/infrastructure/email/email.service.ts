import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    const mailHost = this.configService.get<string>('MAIL_HOST', 'smtp.gmail.com');
    const mailPort = this.configService.get<number>('MAIL_PORT', 587);
    const mailSecure = this.configService.get<boolean>('MAIL_SECURE', false);
    const mailUser = this.configService.get<string>('MAIL_USER');
    const mailFrom = this.configService.get<string>('MAIL_FROM', 'noreply@capacitaciones.com');

    this.logger.log(`Email Service Config:`);
    this.logger.log(`  MAIL_HOST: ${mailHost}`);
    this.logger.log(`  MAIL_PORT: ${mailPort}`);
    this.logger.log(`  MAIL_SECURE: ${mailSecure}`);
    this.logger.log(`  MAIL_USER: ${mailUser}`);
    this.logger.log(`  MAIL_FROM: ${mailFrom}`);
    // DO NOT LOG MAIL_PASSWORD for security reasons

    this.transporter = nodemailer.createTransport({
      host: mailHost,
      port: mailPort,
      secure: mailSecure,
      auth: {
        user: mailUser,
        pass: this.configService.get<string>('MAIL_PASSWORD'),
      },
      tls: {
        rejectUnauthorized: false, // Permite conexiones con certificados auto-firmados o no confiables
      },
    });
  }

  async sendPasswordResetEmail(
    to: string,
    resetToken: string,
    username: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:8080',
    );
    this.logger.log(`Using FRONTEND_URL: ${frontendUrl}`);
    const resetLink = `${frontendUrl}/auth/reset-password?token=${resetToken}`;
    const mailFrom = this.configService.get<string>(
      'MAIL_FROM',
      'noreply@capacitaciones.com',
    );

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1976d2; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .button { display: inline-block; padding: 12px 30px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Recuperación de Contraseña</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${username}</strong>,</p>
            <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en el Sistema de Capacitaciones.</p>
            <p>Para crear una nueva contraseña, haz clic en el siguiente botón:</p>
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">Restablecer Contraseña</a>
            </div>
            <p>O copia y pega el siguiente enlace en tu navegador:</p>
            <p style="word-break: break-all; background-color: #e9ecef; padding: 10px; border-radius: 3px;">
              ${resetLink}
            </p>
            <div class="warning">
              <strong>⚠️ Importante:</strong>
              <ul>
                <li>Este enlace expirará en <strong>1 hora</strong></li>
                <li>Solo puede usarse <strong>una vez</strong></li>
                <li>Si no solicitaste este cambio, ignora este correo</li>
              </ul>
            </div>
            <p>Por tu seguridad, nunca compartas este enlace con nadie.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Sistema de Capacitaciones. Todos los derechos reservados.</p>
            <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from: mailFrom,
        to,
        subject: 'Recuperación de Contraseña - Sistema de Capacitaciones',
        html: htmlContent,
      });
      this.logger.log(`Email de recuperación enviado a: ${to}`);
    } catch (error) {
      this.logger.error(`Error al enviar email de recuperación:`, error);
      throw new Error('No se pudo enviar el correo de recuperación');
    }
  }

  async sendPasswordChangedNotification(
    to: string,
    username: string,
  ): Promise<void> {
    const mailFrom = this.configService.get<string>(
      'MAIL_FROM',
      'noreply@capacitaciones.com',
    );

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4caf50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          .info { background-color: #d1ecf1; border-left: 4px solid #0c5460; padding: 10px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Contraseña Actualizada</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${username}</strong>,</p>
            <p>Te confirmamos que la contraseña de tu cuenta en el Sistema de Capacitaciones ha sido actualizada exitosamente.</p>
            <div class="info">
              <strong>ℹ️ Información:</strong>
              <ul>
                <li>Fecha: ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}</li>
                <li>Tu contraseña ha sido modificada correctamente</li>
              </ul>
            </div>
            <p><strong>Si no realizaste este cambio,</strong> contacta inmediatamente al administrador del sistema, ya que tu cuenta podría estar comprometida.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Sistema de Capacitaciones. Todos los derechos reservados.</p>
            <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from: mailFrom,
        to,
        subject: 'Contraseña Actualizada - Sistema de Capacitaciones',
        html: htmlContent,
      });
      this.logger.log(`Email de confirmación enviado a: ${to}`);
    } catch (error) {
      this.logger.error(`Error al enviar email de confirmación:`, error);
      // No lanzamos error aquí porque el cambio de contraseña ya se hizo
    }
  }

  async sendExpirationAlert(
    to: string,
    nombreDestinatario: string,
    certificado: any,
    diasRestantes: number,
  ): Promise<void> {
    const mailFrom = this.configService.get<string>(
      'MAIL_FROM',
      'noreply@capacitaciones.com',
    );

    // Determinar el color y mensaje según los días restantes
    let colorPrincipal = '#ff9800'; // Naranja por defecto (30 días)
    let iconoAlerta = '⚠️';
    let mensajePrincipal = 'Tu certificado está próximo a vencer';

    if (diasRestantes === 0) {
      colorPrincipal = '#f44336'; // Rojo
      iconoAlerta = '🔴';
      mensajePrincipal = 'Tu certificado vence HOY';
    } else if (diasRestantes <= 7) {
      colorPrincipal = '#ff9800'; // Naranja
      iconoAlerta = '🟡';
      mensajePrincipal = 'Tu certificado vence pronto';
    }

    const cursoNombre =
      certificado.inscripcion?.capacitacion?.titulo || 'Curso';
    const numeroCertificado = certificado.numeroCertificado;
    const fechaVencimiento = new Date(
      certificado.fechaVencimiento,
    ).toLocaleDateString('es-CO');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: ${colorPrincipal}; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .alert-box { background-color: #fff3cd; border-left: 4px solid ${colorPrincipal}; padding: 15px; margin: 20px 0; border-radius: 3px; }
          .info-table { width: 100%; margin: 20px 0; }
          .info-table td { padding: 10px; border-bottom: 1px solid #ddd; }
          .info-table td:first-child { font-weight: bold; width: 40%; }
          .button { display: inline-block; padding: 12px 30px; background-color: ${colorPrincipal}; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          .counter { font-size: 48px; font-weight: bold; color: ${colorPrincipal}; text-align: center; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${iconoAlerta} ${mensajePrincipal}</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${nombreDestinatario}</strong>,</p>
            <p>Te recordamos que tu certificado está próximo a vencer:</p>
            
            <div class="counter">
              ${diasRestantes} ${diasRestantes === 1 ? 'día' : 'día s'}
            </div>
            
            <table class="info-table">
              <tr>
                <td>Curso:</td>
                <td>${cursoNombre}</td>
              </tr>
              <tr>
                <td>Número de Certificado:</td>
                <td>${numeroCertificado}</td>
              </tr>
              <tr>
                <td>Fecha de Vencimiento:</td>
                <td><strong>${fechaVencimiento}</strong></td>
              </tr>
            </table>

            <div class="alert-box">
              <strong>¿Qué debes hacer?</strong>
              <ul>
                <li>Programa tu renovación antes de la fecha de vencimiento</li>
                <li>Contacta con tu coordinador para inscribirte en la siguiente capacitación</li>
                <li>${diasRestantes === 0 ? 'URGENTE: Tu certificado vence hoy' : 'No dejes pasar la fecha límite'}</li>
              </ul>
            </div>

            <p style="margin-top: 30px;">Para más información o renovar tu certificado, contáctanos:</p>
            <ul>
              <li>Email: soporte@qinspecting.com</li>
              <li>Teléfono: [Número de contacto]</li>
            </ul>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Sistema de Capacitaciones. Todos los derechos reservados.</p>
            <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from: mailFrom,
        to,
        subject: `${iconoAlerta} Alerta: Certificado próximo a vencer (${diasRestantes} ${diasRestantes === 1 ? 'día' : 'días'})`,
        html: htmlContent,
      });
      this.logger.log(
        `Alerta de vencimiento enviada a: ${to} (${diasRestantes} días)`,
      );
    } catch (error) {
      this.logger.error(`Error al enviar alerta de vencimiento:`, error);
      throw new Error('No se pudo enviar la alerta de vencimiento');
    }
  }
}
