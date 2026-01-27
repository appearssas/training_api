import { Injectable, Inject, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { ICertificadosRepository } from '@/domain/certificados/ports/certificados.repository.port';
import { CreateCertificadoDto } from '@/application/certificados/dto/create-certificado.dto';
import { Certificado } from '@/entities/certificados/certificado.entity';
import { PdfGeneratorService } from '@/infrastructure/shared/services/pdf-generator.service';
import { QrGeneratorService } from '@/infrastructure/shared/services/qr-generator.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inscripcion } from '@/entities/inscripcion/inscripcion.entity';
import { ConfigService } from '@nestjs/config';
import { StorageService } from '@/infrastructure/shared/services/storage.service';
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
    private readonly storageService: StorageService,
  ) {}

  async execute(createCertificadoDto: CreateCertificadoDto): Promise<Certificado> {
    // Log para debugging: verificar qué inscripcionId se recibe
    console.log('🔍 CreateCertificadoUseCase.execute - inscripcionId recibido:', createCertificadoDto.inscripcionId);
    
    // Validar que la inscripción existe y está aprobada
    const inscripcion = await this.inscripcionRepository.findOne({
      where: { id: createCertificadoDto.inscripcionId },
      relations: [
        'estudiante',
        'capacitacion',
        'capacitacion.instructor',
        'capacitacion.tipoCapacitacion',
      ],
    });
    
    // Log para verificar qué inscripción se cargó
    console.log('🔍 CreateCertificadoUseCase.execute - inscripción cargada:', {
      id: inscripcion?.id,
      capacitacionId: inscripcion?.capacitacion?.id,
      capacitacionTitulo: inscripcion?.capacitacion?.titulo,
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

    // TAREA 1.3: Validar que solo CERTIFIED puede generar certificados (FAL-005)
    const tipoCapacitacionCodigo = inscripcion.capacitacion?.tipoCapacitacion?.codigo?.toUpperCase();
    
    if (!tipoCapacitacionCodigo || tipoCapacitacionCodigo !== 'CERTIFIED') {
      throw new BadRequestException(
        `Solo las capacitaciones de tipo CERTIFIED pueden generar certificados. ` +
        `Tipo actual: ${tipoCapacitacionCodigo || 'desconocido'}`,
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
    const urlVerificacionCompleta = this.qrGenerator.generateVerificationUrlForQR(token);

    // Generar código QR (RF-24) - usar URL completa para que funcione cuando se escanea
    const qrCodeBase64 = await this.qrGenerator.generateQRCode(urlVerificacionCompleta);

    // Preparar datos del certificado
    const certificadoData: any = {
      inscripcionId: createCertificadoDto.inscripcionId,
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
    // El repositorio ya carga las relaciones necesarias
    const certificado = await this.certificadosRepository.create(certificadoData);

    // Validar que el certificado tiene la capacitación cargada correctamente
    if (!certificado.inscripcion?.capacitacion) {
      throw new InternalServerErrorException(
        'Error: El certificado no tiene la capacitación cargada correctamente',
      );
    }

    // CRÍTICO: Asegurar que se use la inscripción cargada previamente con la capacitación correcta
    certificado.inscripcion = inscripcion;

    // Log para debugging
    console.log('📋 Generando certificado (RECORD) con capacitación:', {
      certificadoId: certificado.id,
      capacitacionTitulo: certificado.inscripcion.capacitacion.titulo,
    });

    // CAMBIO ARQUITECTURA: NO GENERAR EL PDF AHORA (On-Demand)
    // En lugar de crear el archivo y guardarlo, guardamos la URL dinámica de descarga
    const baseUrl = this.configService.get<string>('APP_URL') || 'http://localhost:3000';
    // Ajustar la URL para que apunte al endpoint de descarga dinámica
    // Ejemplo: /api/public/certificates/download/HASH
    const dynamicUrl = `/public/certificates/download/${hashVerificacion}`;
    
    certificado.urlCertificado = dynamicUrl;

    // Actualizar certificado con URL dinámica
    return await this.certificadosRepository.update(certificado.id, {
      urlCertificado: dynamicUrl,
    });
  }

  // Método savePdf eliminado ya que no se usa en arquitectura On-Demand
}

