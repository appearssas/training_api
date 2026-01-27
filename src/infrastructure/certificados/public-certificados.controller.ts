import {
  Controller,
  Get,
  Param,
  NotFoundException,
  Res,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Response } from 'express';
import { createReadStream } from 'fs';
import * as fs from 'fs/promises';
import { VerifyCertificadoUseCase } from '@/application/certificados/use-cases/verify-certificado.use-case';
import { RegenerateCertificatesUseCase } from '@/application/certificados/use-cases/regenerate-certificates.use-case';
import { StorageService } from '../shared/services/storage.service';
import { PdfGeneratorService } from '../shared/services/pdf-generator.service';
import { ICertificadosRepository } from '@/domain/certificados/ports/certificados.repository.port';
import { Inject } from '@nestjs/common';
import { Public } from '../shared/auth/decorators/public.decorator';

/**
 * Controlador público de verificación de certificados
 * RF-32: Cualquier persona puede acceder a la URL pública de verificación
 * RF-33: Mostrar información del certificado (sin datos técnicos)
 * RF-34: No mostrar información técnica, de usuario, ni datos del administrador
 */
@ApiTags('public')
@Public()
@Controller('public')
export class PublicCertificadosController {
  constructor(
    private readonly verifyCertificadoUseCase: VerifyCertificadoUseCase,
    private readonly regenerateCertificatesUseCase: RegenerateCertificatesUseCase,
    private readonly storageService: StorageService,
    private readonly pdfGenerator: PdfGeneratorService,
    @Inject('ICertificadosRepository')
    private readonly certificadosRepository: ICertificadosRepository,
  ) {}

  @Public()
  @Get('certificates/download/:hash')
  @ApiOperation({
    summary: 'Descargar certificado PDF (On-Demand)',
    description:
      'Genera el PDF en tiempo real y lo descarga sin guardar en disco.',
  })
  async downloadCertificate(@Param('hash') hash: string, @Res() res: Response) {
    const certificate =
      await this.certificadosRepository.findByHashVerificacion(hash);

    if (!certificate) {
      throw new NotFoundException('Certificado no encontrado');
    }

    // Validar si la inscripción/capacitacion está cargada
    // El repositorio ya debería traer todo con findByHashVerificacion (según vi en el adapter)
    console.log('[Controller] Certificado encontrado:', {
      id: certificate.id,
      hash: certificate.hashVerificacion,
      tieneInscripcion: !!certificate.inscripcion,
      tieneCapacitacion: !!certificate.inscripcion?.capacitacion,
      tieneEstudiante: !!certificate.inscripcion?.estudiante,
      inscripcionId: certificate.inscripcion?.id,
      capacitacionId: certificate.inscripcion?.capacitacion?.id,
      estudianteId: certificate.inscripcion?.estudiante?.id,
    });

    try {
      // Generar PDF en memoria (Buffer)
      const buffer = await this.pdfGenerator.generateCertificate(certificate);

      // Headers para descarga del PDF
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificado-${hash}.pdf"`,
        'Content-Length': buffer.length.toString(),
        // Headers para evitar caché y ver cambios en tiempo real
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
        // Headers adicionales para desarrollo
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
      });

      res.send(buffer);
    } catch (error) {
      console.error('Error generando PDF on-demand:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error al generar el documento PDF';
      throw new BadRequestException(errorMessage);
    }
  }

  @Public()
  @Get('certificates/view/:hash')
  @ApiOperation({
    summary: 'Visualizar certificado PDF en navegador (On-Demand)',
    description:
      'Genera el PDF en tiempo real y lo muestra inline en el navegador para desarrollo. Acepta parámetros de configuración opcionales.',
  })
  async viewCertificate(
    @Param('hash') hash: string,
    @Res() res: Response,
    @Query('config') configJson?: string,
  ) {
    const certificate =
      await this.certificadosRepository.findByHashVerificacion(hash);

    if (!certificate) {
      throw new NotFoundException('Certificado no encontrado');
    }

    try {
      // Parsear configuración opcional desde query parameter
      let config = undefined;
      if (configJson) {
        try {
          config = JSON.parse(decodeURIComponent(configJson));
          console.log(
            '[PDF Editor] Config recibida:',
            JSON.stringify(config, null, 2),
          );
        } catch (e) {
          console.warn('Error parsing config JSON:', e);
          console.warn('Config JSON recibido:', configJson);
        }
      } else {
        console.log(
          '[PDF Editor] No se recibió configuración, usando valores por defecto',
        );
      }

      // Generar PDF en memoria (Buffer) con configuración opcional
      const buffer = await this.pdfGenerator.generateCertificate(
        certificate,
        config,
      );

      // Headers para visualización inline (no descarga)
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="certificado-${hash}.pdf"`,
        'Content-Length': buffer.length.toString(),
        // Headers agresivos para evitar caché y ver cambios en tiempo real
        'Cache-Control': 'no-cache, no-store, must-revalidate, private',
        Pragma: 'no-cache',
        Expires: '0',
        'Last-Modified': new Date().toUTCString(),
        ETag: `"${Date.now()}"`,
        // Permitir iframe para visualizador
        'X-Frame-Options': 'ALLOWALL',
      });

      res.send(buffer);
    } catch (error) {
      console.error('Error generando PDF on-demand:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error al generar el documento PDF';
      throw new BadRequestException(errorMessage);
    }
  }

  @Public()
  @Get('files/:filename')
  @ApiOperation({
    summary: 'Descargar archivo PDF público',
    description:
      'Permite la descarga pública de certificados si se conoce el nombre exacto del archivo.',
  })
  async servePdf(@Param('filename') filename: string, @Res() res: Response) {
    if (!filename.endsWith('.pdf')) {
      throw new BadRequestException('Formato inválido');
    }

    // Rutas posibles
    const possiblePaths = [
      `/certificates/${filename}`,
      `/storage/certificates/${filename}`,
      filename,
    ];

    let filePath = '';
    let found = false;

    // Buscar archivo
    for (const p of possiblePaths) {
      try {
        filePath = this.storageService.getFilePath(p);
        await fs.access(filePath);
        found = true;
        break;
      } catch (e) {
        continue;
      }
    }

    if (!found) {
      throw new NotFoundException('Archivo no encontrado');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    const fileStream = createReadStream(filePath);
    fileStream.pipe(res);
  }

  @Public()
  @Get('regenerate-all-temp')
  async regenerateAllTemp() {
    return this.regenerateCertificatesUseCase.execute();
  }

  @Public()
  @Get('verify/:token')
  @ApiOperation({
    summary: 'Verificar un certificado por token público',
    description:
      'RF-32, RF-33, RF-34: Verificación pública de certificados sin autenticación',
  })
  @ApiParam({
    name: 'token',
    type: 'string',
    description: 'Token de verificación del certificado (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Información del certificado verificada',
    schema: {
      type: 'object',
      properties: {
        isValid: { type: 'boolean', example: true },
        isExpired: { type: 'boolean', example: false },
        fechaEmision: { type: 'string', format: 'date-time' },
        fechaVencimiento: {
          type: 'string',
          format: 'date-time',
          nullable: true,
        },
        certificado: {
          type: 'object',
          properties: {
            numeroCertificado: { type: 'string' },
            // Solo información pública, sin datos técnicos (RF-34)
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Certificado no encontrado o inválido',
  })
  async verify(@Param('token') token: string) {
    try {
      const result = await this.verifyCertificadoUseCase.execute(token);

      // Extraer solo información pública (RF-34)
      const inscripcion = result.certificado.inscripcion as any;
      const estudiante = inscripcion?.estudiante as any;
      const capacitacion = inscripcion?.capacitacion as any;

      return {
        isValid: result.isValid,
        isExpired: result.isExpired,
        fechaEmision: result.fechaEmision,
        fechaVencimiento: result.fechaVencimiento,
        certificado: {
          numeroCertificado: result.certificado.numeroCertificado,
          // Información del conductor (RF-33)
          nombreCompleto: estudiante
            ? `${estudiante.nombres || ''} ${estudiante.apellidos || ''}`.trim()
            : 'N/A',
          numeroDocumento: estudiante?.numeroDocumento || 'N/A',
          // Información del curso (RF-33)
          nombreCurso: capacitacion?.titulo || 'N/A',
          idCapacitacion: capacitacion?.id || 'N/A',
          // Estado (RF-33)
          estado: result.isExpired ? 'VENCIDO' : 'VÁLIDO',
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('Certificado no encontrado o inválido');
    }
  }
}
