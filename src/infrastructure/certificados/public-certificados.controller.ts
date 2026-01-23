import {
  Controller,
  Get,
  Param,
  NotFoundException,
  Res,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { Response } from 'express';
import { createReadStream } from 'fs';
import * as fs from 'fs/promises';
import { VerifyCertificadoUseCase } from '@/application/certificados/use-cases/verify-certificado.use-case';
import { RegenerateCertificatesUseCase } from '@/application/certificados/use-cases/regenerate-certificates.use-case';
import { StorageService } from '../shared/services/storage.service';
import { PdfGeneratorService } from '../shared/services/pdf-generator.service';
import { ICertificadosRepository } from '@/domain/certificados/ports/certificados.repository.port';
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

  @Get('certificates/download/:hash')
  @ApiOperation({
    summary: 'Descargar certificado PDF (On-Demand)',
    description: 'Genera el PDF en tiempo real y lo descarga sin guardar en disco.',
  })
  async downloadCertificate(@Param('hash') hash: string, @Res() res: Response) {
      const certificate = await this.certificadosRepository.findByHashVerificacion(hash);

      if (!certificate) {
          throw new NotFoundException('Certificado no encontrado');
      }

      // Validar si la inscripción/capacitacion está cargada
      // El repositorio ya debería traer todo con findByHashVerificacion (según vi en el adapter)
      
      try {
          // Generar PDF en memoria (Buffer)
          const buffer = await this.pdfGenerator.generateCertificate(certificate);

          res.set({
              'Content-Type': 'application/pdf',
              'Content-Disposition': `inline; filename="certificado-${hash}.pdf"`,
              'Content-Length': buffer.length,
          });

          res.end(buffer);
      } catch (error) {
          console.error('Error generando PDF on-demand:', error);
          throw new BadRequestException('Error al generar el documento PDF');
      }
  }

  @Get('files/:filename')
  @ApiOperation({
    summary: 'Descargar archivo PDF público',
    description: 'Permite la descarga pública de certificados si se conoce el nombre exacto del archivo.',
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

  @Get('regenerate-all-temp')
  async regenerateAllTemp() {
    return this.regenerateCertificatesUseCase.execute();
  }

  @Get('verify/:token')
  @ApiOperation({
    summary: 'Verificar un certificado por token público',
    description: 'RF-32, RF-33, RF-34: Verificación pública de certificados sin autenticación',
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
        fechaVencimiento: { type: 'string', format: 'date-time', nullable: true },
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
  @ApiResponse({ status: 404, description: 'Certificado no encontrado o inválido' })
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
