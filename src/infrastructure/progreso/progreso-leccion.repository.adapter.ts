import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IProgresoLeccionRepository } from '@/domain/progreso/ports/progreso-leccion.repository.port';
import { ProgresoLeccion } from '@/entities/progreso/progreso-leccion.entity';
import { Inscripcion } from '@/entities/inscripcion/inscripcion.entity';
import { Leccion } from '@/entities/lecciones/leccion.entity';

@Injectable()
export class ProgresoLeccionRepositoryAdapter implements IProgresoLeccionRepository {
  constructor(
    @InjectRepository(ProgresoLeccion)
    private readonly progresoRepository: Repository<ProgresoLeccion>,
  ) {}

  async markAllAsCompleted(
    inscripcionId: number,
    leccionIds: number[],
  ): Promise<void> {
    if (leccionIds.length === 0) return;
    const now = new Date();
    for (const leccionId of leccionIds) {
      let progreso = await this.progresoRepository.findOne({
        where: {
          inscripcion: { id: inscripcionId },
          leccion: { id: leccionId },
        },
      });
      if (progreso) {
        progreso.completada = true;
        progreso.fechaCompletada = now;
        await this.progresoRepository.save(progreso);
      } else {
        progreso = this.progresoRepository.create({
          inscripcion: { id: inscripcionId } as Inscripcion,
          leccion: { id: leccionId } as Leccion,
          completada: true,
          fechaCompletada: now,
          tiempoDedicadoMinutos: 0,
        });
        await this.progresoRepository.save(progreso);
      }
    }
  }
}
