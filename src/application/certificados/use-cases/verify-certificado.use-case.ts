import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ICertificadosRepository } from '@/domain/certificados/ports/certificados.repository.port';
import { Certificado } from '@/entities/certificados/certificado.entity';

/**
 * Caso de uso para verificar un certificado por token público
 * RF-32: Acceso público a URL de verificación
 * RF-33: Mostrar información del certificado
 * RF-34: No mostrar información técnica
 */
@Injectable()
export class VerifyCertificadoUseCase {
  constructor(
    @Inject('ICertificadosRepository')
    private readonly certificadosRepository: ICertificadosRepository,
  ) {}

  async execute(token: string): Promise<{
    certificado: Certificado;
    isValid: boolean;
    isExpired: boolean;
    fechaEmision: Date;
    fechaVencimiento: Date | null;
  }> {
    const certificado =
      await this.certificadosRepository.findByHashVerificacion(token);

    if (!certificado) {
      throw new NotFoundException('Certificado no encontrado o inválido');
    }

    if (!certificado.activo) {
      return {
        certificado,
        isValid: false,
        isExpired: false,
        fechaEmision: certificado.fechaEmision,
        fechaVencimiento: certificado.fechaVencimiento,
      };
    }

    // Calcular fecha de emisión (retroactiva si aplica) (RF-28, RF-31)
    const fechaEmision =
      certificado.esRetroactivo && certificado.fechaRetroactiva
        ? certificado.fechaRetroactiva
        : certificado.fechaEmision;

    // Verificar si está vencido
    const isExpired = certificado.fechaVencimiento
      ? new Date() > certificado.fechaVencimiento
      : false;

    return {
      certificado,
      isValid: !isExpired,
      isExpired,
      fechaEmision,
      fechaVencimiento: certificado.fechaVencimiento,
    };
  }
}
