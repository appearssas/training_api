import { Injectable, Inject, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ICertificadosRepository } from '@/domain/certificados/ports/certificados.repository.port';
import { UpdateCertificadoDto } from '@/application/certificados/dto/update-certificado.dto';
import { Certificado } from '@/entities/certificados/certificado.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditoriaCertificadoRetroactivo } from '@/entities/auditoria/auditoria-certificado-retroactivo.entity';

/**
 * Caso de uso para actualizar un certificado con fecha retroactiva
 * RF-25: Solo administrador puede emitir certificado retroactivo
 * RF-27: Validación de fecha retroactiva
 * RF-29: Registro en log de auditoría inmutable
 */
@Injectable()
export class UpdateCertificadoRetroactivoUseCase {
  constructor(
    @Inject('ICertificadosRepository')
    private readonly certificadosRepository: ICertificadosRepository,
    @InjectRepository(AuditoriaCertificadoRetroactivo)
    private readonly auditoriaRepository: Repository<AuditoriaCertificadoRetroactivo>,
  ) {}

  async execute(
    id: number,
    updateDto: UpdateCertificadoDto,
    usuarioId: number,
  ): Promise<Certificado> {
    // Obtener certificado existente
    const certificado = await this.certificadosRepository.findOne(id);

    if (!certificado) {
      throw new NotFoundException(`Certificado con ID ${id} no encontrado`);
    }

    // Validar que se está intentando hacer retroactivo
    if (!updateDto.esRetroactivo || !updateDto.fechaRetroactiva) {
      throw new BadRequestException(
        'Este endpoint solo permite actualizar certificados retroactivos',
      );
    }

    // Validar fecha retroactiva (RF-27)
    const fechaRetroactiva = new Date(updateDto.fechaRetroactiva);
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

    if (!updateDto.justificacionRetroactiva) {
      throw new BadRequestException(
        'La justificación es obligatoria para certificados retroactivos (RF-27)',
      );
    }

    // Registrar en auditoría ANTES de actualizar (RF-29)
    const auditoria = this.auditoriaRepository.create({
      certificado: certificado,
      fechaAprobacionReal: certificado.fechaAprobacionReal || certificado.fechaEmision,
      fechaRetroactiva: fechaRetroactiva,
      justificacion: updateDto.justificacionRetroactiva,
      emitidoPor: { id: usuarioId } as any,
    });

    await this.auditoriaRepository.save(auditoria);

    // Actualizar certificado
    const certificadoActualizado = await this.certificadosRepository.update(id, {
      ...updateDto,
      emitidoPor: usuarioId,
    });

    return certificadoActualizado;
  }
}

