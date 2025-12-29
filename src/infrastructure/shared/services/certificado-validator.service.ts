import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certificado } from '@/entities/certificados/certificado.entity';
import { Inscripcion } from '@/entities/inscripcion/inscripcion.entity';

/**
 * Servicio para validar certificados según RF-10
 * Valida que los certificados existentes no se afecten al cambiar el estado de una capacitación
 */
@Injectable()
export class CertificadoValidatorService {
  constructor(
    @InjectRepository(Certificado)
    private readonly certificadoRepository: Repository<Certificado>,
    @InjectRepository(Inscripcion)
    private readonly inscripcionRepository: Repository<Inscripcion>,
  ) {}

  /**
   * Verifica si una capacitación tiene certificados emitidos
   * @param capacitacionId ID de la capacitación
   * @returns true si tiene certificados, false si no
   */
  async hasCertificados(capacitacionId: number): Promise<boolean> {
    // Buscar inscripciones de la capacitación que tengan certificados
    const inscripciones = await this.inscripcionRepository.find({
      where: { capacitacion: { id: capacitacionId } },
      relations: ['certificados'],
    });

    return inscripciones.some(
      (inscripcion) =>
        inscripcion.certificados && inscripcion.certificados.length > 0,
    );
  }

  /**
   * Obtiene el conteo de certificados emitidos para una capacitación
   * @param capacitacionId ID de la capacitación
   * @returns Número de certificados emitidos
   */
  async getCertificadosCount(capacitacionId: number): Promise<number> {
    const inscripciones = await this.inscripcionRepository.find({
      where: { capacitacion: { id: capacitacionId } },
      relations: ['certificados'],
    });

    return inscripciones.reduce(
      (total, inscripcion) => total + (inscripcion.certificados?.length || 0),
      0,
    );
  }

  /**
   * Valida que se pueda cambiar el estado de una capacitación sin afectar certificados (RF-10)
   * Según RF-10: "Los cursos podrán activarse o desactivarse sin afectar los certificados ya emitidos"
   * Esta función solo informa, no bloquea, ya que el requerimiento permite desactivar incluso con certificados
   * @param capacitacionId ID de la capacitación
   * @returns Información sobre certificados existentes
   */
  async validateEstadoChange(
    capacitacionId: number,
  ): Promise<{ hasCertificados: boolean; count: number }> {
    const hasCertificados = await this.hasCertificados(capacitacionId);
    const count = hasCertificados
      ? await this.getCertificadosCount(capacitacionId)
      : 0;

    return { hasCertificados, count };
  }
}
