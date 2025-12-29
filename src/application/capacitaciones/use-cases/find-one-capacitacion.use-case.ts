import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ICapacitacionesRepository } from '@/domain/capacitaciones/ports/capacitaciones.repository.port';
import { Capacitacion } from '@/entities/capacitacion/capacitacion.entity';
import { writeFileSync, appendFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class FindOneCapacitacionUseCase {
  constructor(
    @Inject('ICapacitacionesRepository')
    private readonly capacitacionesRepository: ICapacitacionesRepository,
  ) {}

  async execute(id: number): Promise<Capacitacion> {
    // #region agent log
    try {
      appendFileSync(
        join(process.cwd(), '.cursor', 'debug.log'),
        JSON.stringify({
          location: 'find-one-capacitacion.use-case.ts:12',
          message: 'execute entry',
          data: { id },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'A',
        }) + '\n',
      );
    } catch (e) {}
    // #endregion
    const capacitacion = await this.capacitacionesRepository.findOne(id);
    // #region agent log
    try {
      appendFileSync(
        join(process.cwd(), '.cursor', 'debug.log'),
        JSON.stringify({
          location: 'find-one-capacitacion.use-case.ts:14',
          message: 'repository.findOne result',
          data: {
            id,
            found: !!capacitacion,
            hasId: capacitacion?.id !== undefined,
          },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'A,B',
        }) + '\n',
      );
    } catch (e) {}
    // #endregion
    if (!capacitacion) {
      // #region agent log
      try {
        appendFileSync(
          join(process.cwd(), '.cursor', 'debug.log'),
          JSON.stringify({
            location: 'find-one-capacitacion.use-case.ts:15',
            message: 'NotFoundException thrown',
            data: { id },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'A',
          }) + '\n',
        );
      } catch (e) {}
      // #endregion
      throw new NotFoundException(`Capacitación con ID ${id} no encontrada`);
    }
    return capacitacion;
  }
}
