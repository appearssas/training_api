import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CertificateFormat, CertificateFormatType } from '@/entities/certificate-formats/certificate-format.entity';
import { CreateCertificateFormatDto } from '@/application/certificate-formats/dto/create-certificate-format.dto';
import { UpdateCertificateFormatDto } from '@/application/certificate-formats/dto/update-certificate-format.dto';

@Injectable()
export class CertificateFormatsRepositoryAdapter {
  constructor(
    @InjectRepository(CertificateFormat)
    private readonly certificateFormatRepository: Repository<CertificateFormat>,
  ) {}

  async create(
    createDto: CreateCertificateFormatDto,
  ): Promise<CertificateFormat> {
    const format = this.certificateFormatRepository.create(createDto);
    return await this.certificateFormatRepository.save(format);
  }

  async findAll(): Promise<CertificateFormat[]> {
    return await this.certificateFormatRepository.find({
      order: { fechaCreacion: 'DESC' },
    });
  }

  async findOne(id: number): Promise<CertificateFormat | null> {
    return await this.certificateFormatRepository.findOne({
      where: { id },
    });
  }

  async findByType(tipo: CertificateFormatType): Promise<CertificateFormat | null> {
    return await this.certificateFormatRepository.findOne({
      where: { tipo, activo: true },
    });
  }

  async findActive(): Promise<CertificateFormat | null> {
    return await this.certificateFormatRepository.findOne({
      where: { activo: true },
      order: { fechaActualizacion: 'DESC' },
    });
  }

  async update(
    id: number,
    updateDto: UpdateCertificateFormatDto,
  ): Promise<CertificateFormat> {
    await this.certificateFormatRepository.update(id, updateDto);
    const updated = await this.findOne(id);
    if (!updated) {
      throw new Error(`CertificateFormat with ID ${id} not found`);
    }
    return updated;
  }

  async updateBackgroundPath(
    tipo: CertificateFormatType,
    path: string,
  ): Promise<CertificateFormat> {
    // Buscar o crear el formato para este tipo
    let format = await this.findByType(tipo);
    
    if (!format) {
      // Crear nuevo formato si no existe
      const newFormat = this.certificateFormatRepository.create({
        tipo,
        activo: true,
      });
      format = await this.certificateFormatRepository.save(newFormat);
    }

    // Actualizar la ruta correspondiente según el tipo
    const updateData: Partial<CertificateFormat> = {};
    switch (tipo) {
      case CertificateFormatType.ALIMENTOS:
        updateData.fondoAlimentosPath = path;
        break;
      case CertificateFormatType.SUSTANCIAS:
        updateData.fondoSustanciasPath = path;
        break;
      case CertificateFormatType.OTROS:
        updateData.fondoGeneralPath = path;
        break;
    }

    await this.certificateFormatRepository.update(format.id, updateData);
    const updated = await this.findOne(format.id);
    if (!updated) {
      throw new Error(`CertificateFormat with ID ${format.id} not found after update`);
    }
    return updated;
  }

  async remove(id: number): Promise<void> {
    await this.certificateFormatRepository.delete(id);
  }

  async deactivateAll(): Promise<void> {
    await this.certificateFormatRepository.update(
      { activo: true },
      { activo: false },
    );
  }
}
