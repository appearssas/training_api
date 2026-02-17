import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Representante } from '@/entities/catalogos/representante.entity';
import { CreateRepresentanteDto, UpdateRepresentanteDto } from '@/application/catalogos/dto';
import { StorageService } from '@/infrastructure/shared/services/storage.service';
import { EntesCertificadoresService } from './entes-certificadores.service';

@Injectable()
export class RepresentantesService {
  constructor(
    @InjectRepository(Representante)
    private readonly repo: Repository<Representante>,
    private readonly storageService: StorageService,
    private readonly entesCertificadoresService: EntesCertificadoresService,
  ) {}

  async findAllByEnte(enteId: number, activoOnly = true): Promise<Representante[]> {
    return this.repo.find({
      where: {
        enteCertificadorId: enteId,
        ...(activoOnly ? { activo: true } : {}),
      },
      order: { nombre: 'ASC' },
    });
  }

  async findOneByEnte(enteId: number, repId: number): Promise<Representante> {
    const rep = await this.repo.findOne({
      where: { id: repId, enteCertificadorId: enteId },
    });
    if (!rep) {
      throw new NotFoundException(
        `Representante con ID ${repId} no encontrado en el ente ${enteId}`,
      );
    }
    return rep;
  }

  async create(enteId: number, dto: CreateRepresentanteDto): Promise<Representante> {
    await this.entesCertificadoresService.findOne(enteId);
    const rep = this.repo.create({
      enteCertificadorId: enteId,
      nombre: dto.nombre.trim(),
      cargo: dto.cargo?.trim() || null,
      activo: dto.activo ?? true,
    });
    return this.repo.save(rep);
  }

  async update(
    enteId: number,
    repId: number,
    dto: UpdateRepresentanteDto,
  ): Promise<Representante> {
    const rep = await this.findOneByEnte(enteId, repId);
    if (dto.nombre != null) rep.nombre = dto.nombre.trim();
    if (dto.cargo !== undefined) rep.cargo = dto.cargo?.trim() ?? null;
    if (dto.activo !== undefined) rep.activo = dto.activo;
    return this.repo.save(rep);
  }

  async remove(enteId: number, repId: number): Promise<void> {
    const rep = await this.findOneByEnte(enteId, repId);
    await this.repo.remove(rep);
  }

  async setFirma(
    enteId: number,
    repId: number,
    file: Express.Multer.File,
  ): Promise<Representante> {
    const rep = await this.findOneByEnte(enteId, repId);
    rep.firmaPath = await this.storageService.saveCatalogFirmaRepresentante(repId, file);
    return this.repo.save(rep);
  }
}
