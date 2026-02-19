import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rol } from '@/entities/roles/rol.entity';
import { IRolesRepository } from '@/domain/roles/ports/roles.repository.port';

@Injectable()
export class RolesRepositoryAdapter implements IRolesRepository {
  constructor(
    @InjectRepository(Rol)
    private readonly rolRepository: Repository<Rol>,
  ) {}

  async findAll(): Promise<Rol[]> {
    return await this.rolRepository.find({
      where: { activo: true },
      order: { nombre: 'ASC' },
    });
  }

  async findByCodigo(codigo: string): Promise<Rol | null> {
    return await this.rolRepository.findOne({
      where: { codigo, activo: true },
    });
  }

  async findById(id: number): Promise<Rol | null> {
    return await this.rolRepository.findOne({
      where: { id, activo: true },
    });
  }
}
