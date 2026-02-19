// Adaptador del repositorio de configuración de sesión
// Implementa el puerto usando TypeORM

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Not } from 'typeorm';
import type {
  IConfiguracionSesionRepository,
  CreateConfiguracionSesionDto,
  UpdateConfiguracionSesionDto,
} from '@/domain/sesion/ports/configuracion-sesion.repository.port';
import { ConfiguracionSesion } from '@/entities/sesion/configuracion-sesion.entity';
import { Usuario } from '@/entities/usuarios/usuario.entity';

@Injectable()
export class ConfiguracionSesionRepositoryAdapter implements IConfiguracionSesionRepository {
  constructor(
    @InjectRepository(ConfiguracionSesion)
    private readonly configuracionSesionRepository: Repository<ConfiguracionSesion>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    private readonly dataSource: DataSource,
  ) {}

  async findActive(): Promise<ConfiguracionSesion | null> {
    return this.configuracionSesionRepository.findOne({
      where: { activo: true },
      relations: ['creadoPor'],
      order: { fechaCreacion: 'DESC' },
    });
  }

  async findAll(): Promise<ConfiguracionSesion[]> {
    return this.configuracionSesionRepository.find({
      relations: ['creadoPor'],
      order: { fechaCreacion: 'DESC' },
    });
  }

  async findOne(id: number): Promise<ConfiguracionSesion | null> {
    return this.configuracionSesionRepository.findOne({
      where: { id },
      relations: ['creadoPor'],
    });
  }

  async create(
    dto: CreateConfiguracionSesionDto,
    creadoPorId: number,
  ): Promise<ConfiguracionSesion> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Desactivar todas las configuraciones existentes si se crea una nueva activa
      if (dto.activo !== false) {
        await queryRunner.manager.update(
          ConfiguracionSesion,
          { activo: true },
          { activo: false },
        );
      }

      const creadoPor = await this.usuarioRepository.findOne({
        where: { id: creadoPorId },
      });

      if (!creadoPor) {
        throw new Error('Usuario no encontrado');
      }

      const configuracion = this.configuracionSesionRepository.create({
        ...dto,
        creadoPor,
        activo: dto.activo ?? true,
      });

      const saved = await queryRunner.manager.save(configuracion);
      await queryRunner.commitTransaction();
      const result = await this.findOne(saved.id);
      if (!result) {
        throw new Error('Error al crear la configuración de sesión');
      }
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async update(
    id: number,
    dto: UpdateConfiguracionSesionDto,
  ): Promise<ConfiguracionSesion> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const configuracion = await this.findOne(id);
      if (!configuracion) {
        throw new Error('Configuración no encontrada');
      }

      // Si se activa una configuración, desactivar las demás
      if (dto.activo === true && !configuracion.activo) {
        await queryRunner.manager
          .createQueryBuilder()
          .update(ConfiguracionSesion)
          .set({ activo: false })
          .where('activo = :activo', { activo: true })
          .andWhere('id != :id', { id })
          .execute();
      }

      await queryRunner.manager.update(ConfiguracionSesion, id, dto);
      await queryRunner.commitTransaction();
      const result = await this.findOne(id);
      if (!result) {
        throw new Error('Error al actualizar la configuración de sesión');
      }
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: number): Promise<void> {
    await this.configuracionSesionRepository.delete(id);
  }
}
