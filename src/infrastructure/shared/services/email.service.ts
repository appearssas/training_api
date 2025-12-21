import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Servicio para envío de correos electrónicos usando Nodemailer
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporter();
  }

  /**
   * Inicializa el transporter de Nodemailer con la configuración del entorno
   */
  private initializeTransporter(): void {
    const emailEnabled = this.configService.get<string>(
      'EMAIL_ENABLED',
      'false',
    );

    if (emailEnabled !== 'true') {
      this.logger.warn(
        'EMAIL_ENABLED=false - Los correos se mostrarán solo en logs',
      );
      return;
    }

    try {
      const host = this.configService.get<string>('EMAIL_HOST');
      const port = this.configService.get<number>('EMAIL_PORT');
      const secure =
        this.configService.get<string>('EMAIL_SECURE', 'false') === 'true';
      const user = this.configService.get<string>('EMAIL_USER');
      const password = this.configService.get<string>('EMAIL_PASSWORD');

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
          'Configuración de email incompleta. Variables requeridas: EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD',
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
      };

      // Para puerto 465 (SSL), configuramos TLS apropiadamente
      // Para puerto 587 (STARTTLS), configuramos TLS
      if (secure && port === 465) {
        // Puerto 465 usa SSL directo
        transporterConfig.requireTLS = false;
        transporterConfig.tls = {
          rejectUnauthorized: false, // Para desarrollo, en producción debería ser true
        };
      } else if (!secure && port === 587) {
        // Puerto 587 usa STARTTLS
        transporterConfig.requireTLS = true;
        transporterConfig.tls = {
          rejectUnauthorized: false, // Para desarrollo, en producción debería ser true
        };
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
    const emailEnabled = this.configService.get<string>(
      'EMAIL_ENABLED',
      'false',
    );

    if (emailEnabled !== 'true' || !this.transporter) {
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
      this.logger.log(
        `   Configuración: HOST=${this.configService.get('EMAIL_HOST')}, PORT=${this.configService.get('EMAIL_PORT')}, SECURE=${this.configService.get('EMAIL_SECURE')}, USER=${this.configService.get('EMAIL_USER')}`,
      );

      const htmlContent = this.generarContenidoEmail(
        nombre,
        username,
        passwordTemporal,
      );

      const emailUser = this.configService.get<string>('EMAIL_USER', '');
      const fromEmail = this.configService.get<string>(
        'EMAIL_FROM',
        emailUser || 'noreply@training.local',
      );
      const fromName = this.configService.get<string>(
        'EMAIL_FROM_NAME',
        'Sistema de Capacitaciones',
      );

      const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to: email,
        subject:
          'Credenciales de Acceso Temporales - Sistema de Capacitaciones',
        html: htmlContent,
      };

      this.logger.log(`   From: ${fromEmail}`);
      this.logger.log(`   To: ${email}`);
      this.logger.log(`   Subject: ${mailOptions.subject}`);

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`✅ Correo enviado exitosamente a ${email}`);
      this.logger.debug(`Message ID: ${info.messageId}`);
    } catch (error) {
      this.logger.error(
        `❌ Error enviando correo a ${email}: ${error.message}`,
      );
      this.logger.error(
        `   Configuración actual: HOST=${this.configService.get('EMAIL_HOST') || 'NO CONFIGURADO'}, PORT=${this.configService.get('EMAIL_PORT') || 'NO CONFIGURADO'}, USER=${this.configService.get('EMAIL_USER') || 'NO CONFIGURADO'}`,
      );
      this.logger.warn(
        '   ⚠️  Verifica que las variables de entorno estén configuradas correctamente en .env',
      );
      // Lanzar el error para que el endpoint de prueba pueda manejarlo
      throw error;
    }
  }

  /**
   * Genera el contenido HTML del email con las credenciales
   * Lee el template HTML y reemplaza las variables
   */
  private generarContenidoEmail(
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
        '../templates/email-credenciales-temporales.html',
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
        return this.getInlineTemplate(nombre, username, passwordTemporal);
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
      return this.getInlineTemplate(nombre, username, passwordTemporal);
    }
  }

  /**
   * Template inline como fallback
   */
  private getInlineTemplate(
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
