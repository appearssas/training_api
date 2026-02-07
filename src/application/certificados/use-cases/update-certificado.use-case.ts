import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ICertificadosRepository } from '@/domain/certificados/ports/certificados.repository.port';
import { UpdateCertificadoDto } from '@/application/certificados/dto/update-certificado.dto';
import { Certificado } from '@/entities/certificados/certificado.entity';

/**
 * Caso de uso para actualizar datos editables de un certificado
 * (fecha de expedición y fecha de caducidad).
 * Solo aplica los campos fechaEmision y fechaVencimiento.
 */
@Injectable()
export class UpdateCertificadoUseCase {
  constructor(
    @Inject('ICertificadosRepository')
    private readonly certificadosRepository: ICertificadosRepository,
  ) {}

  async execute(id: number, dto: UpdateCertificadoDto): Promise<Certificado> {
    const certificado = await this.certificadosRepository.findOne(id);

    if (!certificado) {
      throw new NotFoundException(`Certificado con ID ${id} no encontrado`);
    }

    const fechaEmision = dto.fechaEmision
      ? new Date(dto.fechaEmision)
      : undefined;
    const fechaVencimiento = dto.fechaVencimiento
      ? new Date(dto.fechaVencimiento)
      : undefined;

    if (fechaEmision && fechaVencimiento && fechaVencimiento < fechaEmision) {
      throw new BadRequestException(
        'La fecha de caducidad no puede ser anterior a la fecha de expedición',
      );
    }

    const updateDto: UpdateCertificadoDto = {};
    if (dto.fechaEmision !== undefined) {
      updateDto.fechaEmision = dto.fechaEmision;
    }
    if (dto.fechaVencimiento !== undefined) {
      updateDto.fechaVencimiento = dto.fechaVencimiento;
    }

    if (Object.keys(updateDto).length === 0) {
      return certificado;
    }

    return this.certificadosRepository.update(id, updateDto);
  }
}
