import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnteCertificador } from '@/entities/catalogos/ente-certificador.entity';
import { CreateEnteCertificadorDto, UpdateEnteCertificadorDto } from '@/application/catalogos/dto';
import { StorageService } from '@/infrastructure/shared/services/storage.service';

@Injectable()
export class EntesCertificadoresService {
  constructor(
    @InjectRepository(EnteCertificador)
    private readonly repo: Repository<EnteCertificador>,
    private readonly storageService: StorageService,
  ) {}

  async findAll(activoOnly?: boolean): Promise<EnteCertificador[]> {
    return this.repo.find({
      where: activoOnly ? { activo: true } : undefined,
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: number): Promise<EnteCertificador> {
    const ente = await this.repo.findOne({ where: { id } });
    if (!ente) throw new NotFoundException(`Ente certificador con ID ${id} no encontrado`);
    return ente;
  }

  async create(dto: CreateEnteCertificadorDto): Promise<EnteCertificador> {
    const existing = await this.repo.findOne({ where: { codigo: dto.codigo.trim() } });
    if (existing) {
      throw new ConflictException(`Ya existe un ente certificador con el código "${dto.codigo}"`);
    }
    const ente = new EnteCertificador();
    ente.nombre = dto.nombre.trim();
    ente.codigo = dto.codigo.trim();
    ente.descripcion = dto.descripcion?.trim() ?? '';
    ente.informacionContacto = dto.informacionContacto?.trim() ?? '';
    ente.activo = dto.activo ?? true;
    return this.repo.save(ente);
  }

  async update(id: number, dto: UpdateEnteCertificadorDto): Promise<EnteCertificador> {
    const ente = await this.findOne(id);
    if (dto.codigo != null && dto.codigo.trim() !== ente.codigo) {
      const existing = await this.repo.findOne({ where: { codigo: dto.codigo.trim() } });
      if (existing) {
        throw new ConflictException(`Ya existe un ente certificador con el código "${dto.codigo}"`);
      }
      ente.codigo = dto.codigo.trim();
    }
    if (dto.nombre != null) ente.nombre = dto.nombre.trim();
    if (dto.descripcion !== undefined) ente.descripcion = dto.descripcion?.trim() ?? null;
    if (dto.informacionContacto !== undefined) ente.informacionContacto = dto.informacionContacto?.trim() ?? null;
    if (dto.activo !== undefined) ente.activo = dto.activo;
    return this.repo.save(ente);
  }

  async remove(id: number): Promise<void> {
    const ente = await this.findOne(id);
    await this.repo.remove(ente);
  }

  /** Sube el logo del ente y actualiza logoPath. */
  async setLogo(id: number, file: Express.Multer.File): Promise<EnteCertificador> {
    const ente = await this.findOne(id);
    const path = await this.storageService.saveCatalogLogo(id, file);
    ente.logoPath = path;
    return this.repo.save(ente);
  }
}
