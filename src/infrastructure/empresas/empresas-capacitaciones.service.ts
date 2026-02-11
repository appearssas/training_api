import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CapacitacionEmpresa } from '@/entities/empresas/capacitacion-empresa.entity';
import { Empresa } from '@/entities/empresas/empresa.entity';
import { Capacitacion } from '@/entities/capacitacion/capacitacion.entity';

/**
 * Servicio para la asignación de cursos a empresas (flujo institucional).
 * Admin asigna cursos a una empresa; el cliente institucional asigna esos cursos a sus usuarios.
 */
@Injectable()
export class EmpresasCapacitacionesService {
  constructor(
    @InjectRepository(CapacitacionEmpresa)
    private readonly capacitacionEmpresaRepository: Repository<CapacitacionEmpresa>,
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
    @InjectRepository(Capacitacion)
    private readonly capacitacionRepository: Repository<Capacitacion>,
  ) {}

  /**
   * Asigna cursos a una empresa (solo ADMIN). El cliente institucional podrá asignar estos cursos a sus usuarios.
   */
  async assignCapacitacionesToEmpresa(
    empresaId: number,
    courseIds: number[],
  ): Promise<{ assigned: number; skipped: number; details: string[] }> {
    const empresa = await this.empresaRepository.findOne({
      where: { id: empresaId, activo: true, eliminada: false },
    });
    if (!empresa) {
      throw new NotFoundException(`Empresa con ID ${empresaId} no encontrada`);
    }

    const existing = await this.capacitacionEmpresaRepository.find({
      where: { empresaId, capacitacionId: In(courseIds) },
    });
    const existingCapacitacionIds = new Set(
      existing.map(ce => ce.capacitacionId),
    );
    const toCreate = courseIds.filter(id => !existingCapacitacionIds.has(id));

    const validCapacitaciones = await this.capacitacionRepository.find({
      where: { id: In(toCreate) },
    });
    const validIds = new Set(validCapacitaciones.map(c => c.id));
    const details: string[] = [];
    let assigned = 0;

    for (const capacitacionId of toCreate) {
      if (!validIds.has(capacitacionId)) {
        details.push(`Capacitación ${capacitacionId} no existe, omitida`);
        continue;
      }
      await this.capacitacionEmpresaRepository.save({
        empresaId,
        capacitacionId,
      });
      assigned++;
      details.push(`Capacitación ${capacitacionId} asignada a la empresa`);
    }

    return {
      assigned,
      skipped: courseIds.length - assigned,
      details,
    };
  }

  /**
   * Devuelve los IDs de capacitaciones asignadas a una empresa (para que el cliente solo vea/asigne esos cursos).
   */
  async getCapacitacionIdsByEmpresa(empresaId: number): Promise<number[]> {
    const rows = await this.capacitacionEmpresaRepository.find({
      where: { empresaId },
      select: ['capacitacionId'],
    });
    return rows.map(r => r.capacitacionId);
  }

  /**
   * Indica si una capacitación está asignada a una empresa (para validar inscripciones del cliente).
   */
  async isCapacitacionAssignedToEmpresa(
    capacitacionId: number,
    empresaId: number,
  ): Promise<boolean> {
    const count = await this.capacitacionEmpresaRepository.count({
      where: { empresaId, capacitacionId },
    });
    return count > 0;
  }

  /**
   * Quita un curso de una empresa (solo ADMIN). La empresa deja de tener acceso a asignar ese curso a sus usuarios.
   */
  async removeCapacitacionFromEmpresa(
    empresaId: number,
    capacitacionId: number,
  ): Promise<{ removed: boolean; message: string }> {
    const result = await this.capacitacionEmpresaRepository.delete({
      empresaId,
      capacitacionId,
    });
    const removed = (result.affected ?? 0) > 0;
    return {
      removed,
      message: removed
        ? 'Curso quitado de la empresa'
        : 'No existía la asignación o ya fue eliminada',
    };
  }

  /**
   * Devuelve las empresas que tienen asignado un curso (para que el admin vea y pueda quitar).
   */
  async getEmpresasByCapacitacion(capacitacionId: number): Promise<Empresa[]> {
    const rows = await this.capacitacionEmpresaRepository.find({
      where: { capacitacionId },
      relations: ['empresa'],
      select: ['id', 'empresaId', 'capacitacionId'],
    });
    const empresas = rows
      .map(r => r.empresa)
      .filter((e): e is Empresa => e != null);
    return empresas;
  }
}
