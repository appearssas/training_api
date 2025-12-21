import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Servicio unificado para envío de correos electrónicos usando Nodemailer
 * Soporta variables de entorno EMAIL_* (estándar) y MAIL_* (legacy)
 */
@Injectable()
export class EmailService {
  private transporter: Transporter | null = null;
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporter();
  }

  /**
   * Inicializa el transporter de Nodemailer con la configuración del entorno
   * Soporta variables EMAIL_* (preferido) y MAIL_* (legacy para compatibilidad)
   */
  private initializeTransporter(): void {
    const emailEnabled = this.configService.get<string>(
      'EMAIL_ENABLED',
      this.configService.get<string>('MAIL_ENABLED', 'false'),
    );

    if (emailEnabled !== 'true') {
      this.logger.warn(
        'EMAIL_ENABLED=false - Los correos se mostrarán solo en logs',
      );
      return;
    }

    try {
      // Soporta tanto EMAIL_* como MAIL_* para compatibilidad
      const host =
        this.configService.get<string>('EMAIL_HOST') ||
        this.configService.get<string>('MAIL_HOST', 'smtp.gmail.com');
      const port =
        this.configService.get<number>('EMAIL_PORT') ||
        this.configService.get<number>('MAIL_PORT', 587);
      const secure =
        this.configService.get<string>('EMAIL_SECURE', 'false') === 'true' ||
        this.configService.get<boolean>('MAIL_SECURE', false);
      const user =
        this.configService.get<string>('EMAIL_USER') ||
        this.configService.get<string>('MAIL_USER');
      const password =
        this.configService.get<string>('EMAIL_PASSWORD') ||
        this.configService.get<string>('MAIL_PASSWORD');

      this.logger.log('🔧 Inicializando transporter de email...');
      this.logger.log(`   HOST: ${host || 'NO CONFIGURADO'}`);
      this.logger.log(`   PORT: ${port || 'NO CONFIGURADO'}`);
      this.logger.log(`   SECURE: ${secure}`);
      this.logger.log(`   USER: ${user || 'NO CONFIGURADO'}`);
      this.logger.log(
        `   PASSWORD: ${password ? '***CONFIGURADO***' : 'NO CONFIGURADO'}`,
      );

      if (!host || !port || !user || !password) {
        this.logger.error(
          'Configuración de email incompleta. Variables requeridas: EMAIL_HOST (o MAIL_HOST), EMAIL_PORT (o MAIL_PORT), EMAIL_USER (o MAIL_USER), EMAIL_PASSWORD (o MAIL_PASSWORD)',
        );
        this.logger.error(
          `Valores actuales: HOST=${host || 'NO CONFIGURADO'}, PORT=${port || 'NO CONFIGURADO'}, USER=${user ? 'CONFIGURADO' : 'NO CONFIGURADO'}, PASSWORD=${password ? 'CONFIGURADO' : 'NO CONFIGURADO'}`,
        );
        return;
      }

      // Configuración del transporter
      const transporterConfig: any = {
        host,
        port,
        secure, // true para puerto 465, false para otros puertos
        auth: {
          user,
          pass: password,
        },
        tls: {
          rejectUnauthorized: false, // Para desarrollo, en producción debería ser true
        },
      };

      // Para puerto 465 (SSL), configuramos TLS apropiadamente
      // Para puerto 587 (STARTTLS), configuramos TLS
      if (secure && port === 465) {
        // Puerto 465 usa SSL directo
        transporterConfig.requireTLS = false;
      } else if (!secure && port === 587) {
        // Puerto 587 usa STARTTLS
        transporterConfig.requireTLS = true;
      }

      this.transporter = nodemailer.createTransport(
        transporterConfig as nodemailer.TransportOptions,
      );

      this.logger.log('✅ Transporter de email configurado correctamente');
      this.logger.log(
        `   Configuración final: Host=${host}, Port=${port}, Secure=${secure}, User=${user}`,
      );
    } catch (error) {
      this.logger.error(
        `Error configurando transporter de email: ${error.message}`,
      );
    }
  }

  /**
   * Obtiene el email "from" configurado
   * IMPORTANTE: Muchos servidores SMTP (como el de qinspecting.com) requieren que el FROM
   * sea exactamente el mismo que el EMAIL_USER para prevenir spoofing.
   * Por lo tanto, siempre usamos EMAIL_USER como FROM, ignorando EMAIL_FROM si es diferente.
   */
  private getFromEmail(): string {
    const emailUser =
      this.configService.get<string>('EMAIL_USER') ||
      this.configService.get<string>('MAIL_USER', '');

    // Obtener EMAIL_FROM si está configurado (solo para logging)
    const configuredFrom =
      this.configService.get<string>('EMAIL_FROM') ||
      this.configService.get<string>('MAIL_FROM');

    // Siempre usar EMAIL_USER como FROM para evitar errores de spoofing
    const fromEmail = emailUser || 'noreply@capacitaciones.com';

    // Si EMAIL_FROM está configurado pero es diferente, loguear una advertencia
    if (configuredFrom && configuredFrom !== emailUser && emailUser) {
      this.logger.warn(
        `EMAIL_FROM (${configuredFrom}) está configurado pero es diferente a EMAIL_USER (${emailUser}). ` +
          `El servidor SMTP requiere que coincidan. Usando EMAIL_USER (${emailUser}) como FROM.`,
      );
    }

    const fromName = this.configService.get<string>(
      'EMAIL_FROM_NAME',
      'Sistema de Capacitaciones',
    );
    return `"${fromName}" <${fromEmail}>`;
  }

  /**
   * Verifica si el email está habilitado
   */
  private isEmailEnabled(): boolean {
    const emailEnabled = this.configService.get<string>(
      'EMAIL_ENABLED',
      this.configService.get<string>('MAIL_ENABLED', 'false'),
    );
    return emailEnabled === 'true' && this.transporter !== null;
  }

  /**
   * Envía un correo con las credenciales de acceso temporal
   *
   * @param email - Dirección de correo del destinatario
   * @param nombre - Nombre del usuario
   * @param username - Username para login
   * @param passwordTemporal - Contraseña temporal
   */
  async enviarCredencialesTemporales(
    email: string,
    nombre: string,
    username: string,
    passwordTemporal: string,
  ): Promise<void> {
    if (!this.isEmailEnabled()) {
      // En desarrollo, solo mostrar en logs
      this.logger.log(
        '═══════════════════════════════════════════════════════',
      );
      this.logger.log('📧 CREDENCIALES TEMPORALES (Desarrollo)');
      this.logger.log(
        '═══════════════════════════════════════════════════════',
      );
      this.logger.log(`Para: ${email}`);
      this.logger.log(`Nombre: ${nombre}`);
      this.logger.log(`Username: ${username}`);
      this.logger.log(`Password Temporal: ${passwordTemporal}`);
      this.logger.log(
        '═══════════════════════════════════════════════════════',
      );
      this.logger.warn(
        '⚠️  Para enviar correos reales, configura EMAIL_ENABLED=true y las variables de email en .env',
      );
      return;
    }

    try {
      this.logger.log(`📧 Intentando enviar correo a: ${email}`);

      const htmlContent = this.generarContenidoEmailCredenciales(
        nombre,
        username,
        passwordTemporal,
      );

      if (!this.transporter) {
        throw new Error('Transporter no está configurado');
      }

      const mailOptions = {
        from: this.getFromEmail(),
        to: email,
        subject:
          'Credenciales de Acceso Temporales - Sistema de Capacitaciones',
        html: htmlContent,
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`✅ Correo enviado exitosamente a ${email}`);
      this.logger.debug(`Message ID: ${info.messageId}`);
    } catch (error) {
      this.logger.error(
        `❌ Error enviando correo a ${email}: ${error.message}`,
      );
      this.logger.error(
        `   Configuración actual: HOST=${this.configService.get('EMAIL_HOST') || this.configService.get('MAIL_HOST') || 'NO CONFIGURADO'}, PORT=${this.configService.get('EMAIL_PORT') || this.configService.get('MAIL_PORT') || 'NO CONFIGURADO'}, USER=${this.configService.get('EMAIL_USER') || this.configService.get('MAIL_USER') || 'NO CONFIGURADO'}`,
      );
      this.logger.warn(
        '   ⚠️  Verifica que las variables de entorno estén configuradas correctamente en .env',
      );
      throw error;
    }
  }

  /**
   * Envía un correo de recuperación de contraseña
   */
  async sendPasswordResetEmail(
    to: string,
    resetToken: string,
    username: string,
  ): Promise<void> {
    if (!this.isEmailEnabled()) {
      this.logger.log(
        '═══════════════════════════════════════════════════════',
      );
      this.logger.log('📧 RECUPERACIÓN DE CONTRASEÑA (Desarrollo)');
      this.logger.log(
        '═══════════════════════════════════════════════════════',
      );
      this.logger.log(`Para: ${to}`);
      this.logger.log(`Username: ${username}`);
      this.logger.log(`Token: ${resetToken}`);
      this.logger.log(
        '═══════════════════════════════════════════════════════',
      );
      return;
    }

    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:8080',
    );
    this.logger.log(`Using FRONTEND_URL: ${frontendUrl}`);
    const resetLink = `${frontendUrl}/auth/reset-password?token=${resetToken}`;

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
            <p>Hola <strong>${this.escapeHtml(username)}</strong>,</p>
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
      if (!this.transporter) {
        throw new Error('Transporter no está configurado');
      }

      await this.transporter.sendMail({
        from: this.getFromEmail(),
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

  /**
   * Envía un correo de notificación de cambio de contraseña
   */
  async sendPasswordChangedNotification(
    to: string,
    username: string,
  ): Promise<void> {
    if (!this.isEmailEnabled()) {
      this.logger.log(
        '═══════════════════════════════════════════════════════',
      );
      this.logger.log('📧 NOTIFICACIÓN DE CAMBIO DE CONTRASEÑA (Desarrollo)');
      this.logger.log(
        '═══════════════════════════════════════════════════════',
      );
      this.logger.log(`Para: ${to}`);
      this.logger.log(`Username: ${username}`);
      this.logger.log(
        '═══════════════════════════════════════════════════════',
      );
      return;
    }

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
            <p>Hola <strong>${this.escapeHtml(username)}</strong>,</p>
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
      if (!this.transporter) {
        throw new Error('Transporter no está configurado');
      }

      await this.transporter.sendMail({
        from: this.getFromEmail(),
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

  /**
   * Envía una alerta de vencimiento de certificado
   */
  async sendExpirationAlert(
    to: string,
    nombreDestinatario: string,
    certificado: any,
    diasRestantes: number,
  ): Promise<void> {
    if (!this.isEmailEnabled()) {
      this.logger.log(
        '═══════════════════════════════════════════════════════',
      );
      this.logger.log('📧 ALERTA DE VENCIMIENTO (Desarrollo)');
      this.logger.log(
        '═══════════════════════════════════════════════════════',
      );
      this.logger.log(`Para: ${to}`);
      this.logger.log(`Nombre: ${nombreDestinatario}`);
      this.logger.log(`Certificado: ${certificado.numeroCertificado}`);
      this.logger.log(`Días restantes: ${diasRestantes}`);
      this.logger.log(
        '═══════════════════════════════════════════════════════',
      );
      return;
    }

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
            <p>Hola <strong>${this.escapeHtml(nombreDestinatario)}</strong>,</p>
            <p>Te recordamos que tu certificado está próximo a vencer:</p>

            <div class="counter">
              ${diasRestantes} ${diasRestantes === 1 ? 'día' : 'días'}
            </div>

            <table class="info-table">
              <tr>
                <td>Curso:</td>
                <td>${this.escapeHtml(cursoNombre)}</td>
              </tr>
              <tr>
                <td>Número de Certificado:</td>
                <td>${this.escapeHtml(numeroCertificado)}</td>
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
      if (!this.transporter) {
        throw new Error('Transporter no está configurado');
      }

      await this.transporter.sendMail({
        from: this.getFromEmail(),
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

  /**
   * Genera el contenido HTML del email con las credenciales
   * Intenta leer el template HTML, si no existe usa template inline
   */
  private generarContenidoEmailCredenciales(
    nombre: string,
    username: string,
    passwordTemporal: string,
  ): string {
    try {
      // Intentar leer el template HTML
      // En desarrollo: desde src/
      // En producción: desde dist/
      let templatePath = path.join(
        __dirname,
        '../../shared/templates/email-credenciales-temporales.html',
      );

      // Si no existe, intentar desde la raíz del proyecto
      if (!fs.existsSync(templatePath)) {
        templatePath = path.join(
          process.cwd(),
          'dist/infrastructure/shared/templates/email-credenciales-temporales.html',
        );
      }

      // Si aún no existe, intentar desde src (desarrollo)
      if (!fs.existsSync(templatePath)) {
        templatePath = path.join(
          process.cwd(),
          'src/infrastructure/shared/templates/email-credenciales-temporales.html',
        );
      }

      let template = '';
      if (fs.existsSync(templatePath)) {
        template = fs.readFileSync(templatePath, 'utf-8');
        this.logger.debug(`Template cargado desde: ${templatePath}`);
      } else {
        // Si no existe el archivo, usar template inline
        this.logger.warn(
          `Template HTML no encontrado en ${templatePath}, usando template inline`,
        );
        return this.getInlineTemplateCredenciales(
          nombre,
          username,
          passwordTemporal,
        );
      }

      // Reemplazar variables en el template
      return template
        .replace(/\{\{nombre\}\}/g, this.escapeHtml(nombre))
        .replace(/\{\{username\}\}/g, this.escapeHtml(username))
        .replace(
          /\{\{passwordTemporal\}\}/g,
          this.escapeHtml(passwordTemporal),
        );
    } catch (error) {
      this.logger.error(`Error generando contenido de email: ${error.message}`);
      // Fallback a template inline
      return this.getInlineTemplateCredenciales(
        nombre,
        username,
        passwordTemporal,
      );
    }
  }

  /**
   * Template inline como fallback para credenciales temporales
   */
  private getInlineTemplateCredenciales(
    nombre: string,
    username: string,
    passwordTemporal: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .credentials { background-color: white; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0; }
          .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 Sistema de Capacitaciones</h1>
            <p>Credenciales de Acceso Temporales</p>
          </div>
          <div class="content">
            <p>Estimado/a <strong>${this.escapeHtml(nombre)}</strong>,</p>
            <p>Se ha creado tu cuenta en el sistema. A continuación encontrarás tus credenciales de acceso temporales:</p>

            <div class="credentials">
              <p><strong>Usuario:</strong> ${this.escapeHtml(username)}</p>
              <p><strong>Contraseña Temporal:</strong> ${this.escapeHtml(passwordTemporal)}</p>
            </div>

            <div class="warning">
              <p><strong>⚠️ IMPORTANTE:</strong></p>
              <p>Por seguridad, deberás cambiar tu contraseña al iniciar sesión por primera vez.</p>
            </div>

            <p>Para acceder al sistema:</p>
            <ol>
              <li>Ingresa con tus credenciales temporales</li>
              <li>El sistema te solicitará cambiar tu contraseña</li>
              <li>Establece una contraseña segura de tu elección</li>
            </ol>

            <p>Si tienes alguna pregunta, contacta al administrador del sistema.</p>
          </div>
          <div class="footer">
            <p>Este es un correo automático, por favor no respondas.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Escapa caracteres HTML para prevenir XSS
   */
  private escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}
