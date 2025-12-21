import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { ICertificadosRepository } from '@/domain/certificados/ports/certificados.repository.port';
import { CreateCertificadoDto } from '@/application/certificados/dto/create-certificado.dto';
import { Certificado } from '@/entities/certificados/certificado.entity';
import { PdfGeneratorService } from '@/infrastructure/shared/services/pdf-generator.service';
import { QrGeneratorService } from '@/infrastructure/shared/services/qr-generator.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inscripcion } from '@/entities/inscripcion/inscripcion.entity';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Caso de uso para crear un certificado
 * RF-22: Generación automática de certificado PDF
 * RF-23: Campos del certificado
 * RF-24: Código QR con UUID v4
 * RF-25 a RF-31: Soporte para certificados retroactivos
 */
@Injectable()
export class CreateCertificadoUseCase {
  constructor(
    @Inject('ICertificadosRepository')
    private readonly certificadosRepository: ICertificadosRepository,
    private readonly pdfGenerator: PdfGeneratorService,
    private readonly qrGenerator: QrGeneratorService,
    @InjectRepository(Inscripcion)
    private readonly inscripcionRepository: Repository<Inscripcion>,
    private readonly configService: ConfigService,
  ) {}

  async execute(createCertificadoDto: CreateCertificadoDto): Promise<Certificado> {
    // Validar que la inscripción existe y está aprobada
    const inscripcion = await this.inscripcionRepository.findOne({
      where: { id: createCertificadoDto.inscripcionId },
      relations: ['estudiante', 'capacitacion', 'capacitacion.instructor'],
    });

    if (!inscripcion) {
      throw new NotFoundException(
        `Inscripción con ID ${createCertificadoDto.inscripcionId} no encontrada`,
      );
    }

    if (!inscripcion.aprobado) {
      throw new BadRequestException(
        'La inscripción debe estar aprobada para generar un certificado (RF-20)',
      );
    }

    // Validar fecha retroactiva si aplica (RF-27)
    if (createCertificadoDto.esRetroactivo && createCertificadoDto.fechaRetroactiva) {
      const fechaRetroactiva = new Date(createCertificadoDto.fechaRetroactiva);
      const fechaActual = new Date();
      const mesesAtras = 6; // Configurable
      const fechaLimite = new Date();
      fechaLimite.setMonth(fechaLimite.getMonth() - mesesAtras);

      if (fechaRetroactiva > fechaActual) {
        throw new BadRequestException(
          'La fecha retroactiva no puede ser posterior a la fecha actual (RF-27)',
        );
      }

      if (fechaRetroactiva < fechaLimite) {
        throw new BadRequestException(
          `La fecha retroactiva no puede ser anterior a ${mesesAtras} meses (RF-27)`,
        );
      }

      if (!createCertificadoDto.justificacionRetroactiva) {
        throw new BadRequestException(
          'La justificación es obligatoria para certificados retroactivos (RF-27)',
        );
      }
    }

    // Generar token único UUID v4 (RF-24)
    const token = this.qrGenerator.generateVerificationToken();
    const hashVerificacion = this.qrGenerator.generateVerificationHash(token);
    const urlVerificacion = this.qrGenerator.generateVerificationUrl(token);

    // Generar código QR (RF-24)
    const qrCodeBase64 = await this.qrGenerator.generateQRCode(urlVerificacion);

    // Preparar datos del certificado
    const certificadoData: any = {
      inscripcion: { id: createCertificadoDto.inscripcionId } as any,
      numeroCertificado: `CERT-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      fechaAprobacionReal: new Date(), // Fecha real de aprobación
      hashVerificacion,
      codigoQr: qrCodeBase64,
      urlVerificacionPublica: urlVerificacion,
      activo: true,
    };

    // Agregar datos retroactivos si aplica (RF-25 a RF-31)
    if (createCertificadoDto.esRetroactivo) {
      certificadoData.esRetroactivo = true;
      certificadoData.fechaRetroactiva = new Date(createCertificadoDto.fechaRetroactiva!);
      certificadoData.justificacionRetroactiva = createCertificadoDto.justificacionRetroactiva;
    }

    // Crear el certificado en la base de datos
    const certificado = await this.certificadosRepository.create(certificadoData);

    // Generar PDF del certificado (RF-22, RF-23)
    const pdfBuffer = await this.pdfGenerator.generateCertificate(certificado);

    // Guardar PDF en almacenamiento
    const pdfUrl = await this.savePdf(certificado.id, pdfBuffer);
    certificado.urlCertificado = pdfUrl;

    // Actualizar certificado con URL del PDF
    return await this.certificadosRepository.update(certificado.id, {
      urlCertificado: pdfUrl,
    });
  }

  /**
   * Guarda el PDF en almacenamiento local o S3
   * @param certificadoId ID del certificado
   * @param pdfBuffer Buffer del PDF
   * @returns URL del PDF guardado
   */
  private async savePdf(certificadoId: number, pdfBuffer: Buffer): Promise<string> {
    const storagePath = this.configService.get<string>('PDF_STORAGE_PATH') || './storage/certificates';
    
    // Asegurar que el directorio existe
    await fs.mkdir(storagePath, { recursive: true });

    const fileName = `certificado-${certificadoId}-${Date.now()}.pdf`;
    const filePath = path.join(storagePath, fileName);

    await fs.writeFile(filePath, pdfBuffer);

    // Retornar URL relativa o absoluta según configuración
    const baseUrl = this.configService.get<string>('APP_URL') || 'http://localhost:3000';
    return `${baseUrl}/certificates/${fileName}`;
  }
}

