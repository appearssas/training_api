import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Instructor } from '@/entities/instructores/instructor.entity';
import { StorageService } from '@/infrastructure/shared/services/storage.service';

@Injectable()
export class InstructoresCatalogosService {
  constructor(
    @InjectRepository(Instructor)
    private readonly repo: Repository<Instructor>,
    private readonly storageService: StorageService,
  ) {}

  /** Lista todos los instructores con datos de persona (para Config > Docentes). */
  async findAll(): Promise<Instructor[]> {
    return this.repo.find({
      relations: ['persona'],
      order: { id: 'ASC' },
    });
  }

  /** Obtiene un instructor por ID (id de la tabla instructores). */
  async findOne(id: number): Promise<Instructor> {
    const instructor = await this.repo.findOne({
      where: { id },
      relations: ['persona'],
    });
    if (!instructor) {
      throw new NotFoundException(`Instructor con ID ${id} no encontrado`);
    }
    return instructor;
  }

  /** Sube la firma del instructor y actualiza firmaPath. */
  async setFirma(id: number, file: Express.Multer.File): Promise<Instructor> {
    const instructor = await this.findOne(id);
    const path = await this.storageService.saveCatalogFirma(id, file);
    instructor.firmaPath = path;
    return this.repo.save(instructor);
  }
}
