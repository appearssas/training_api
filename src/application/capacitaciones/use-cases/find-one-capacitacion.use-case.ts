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
    try{appendFileSync(join(process.cwd(),'.cursor','debug.log'),JSON.stringify({location:'find-one-capacitacion.use-case.ts:12',message:'execute entry',data:{id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n');}catch(e){}
    // #endregion
    const capacitacion = await this.capacitacionesRepository.findOne(id);
    // #region agent log
    try{appendFileSync(join(process.cwd(),'.cursor','debug.log'),JSON.stringify({location:'find-one-capacitacion.use-case.ts:14',message:'repository.findOne result',data:{id,found:!!capacitacion,hasId:capacitacion?.id!==undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B'})+'\n');}catch(e){}
    // #endregion
    if (!capacitacion) {
      // #region agent log
      try{appendFileSync(join(process.cwd(),'.cursor','debug.log'),JSON.stringify({location:'find-one-capacitacion.use-case.ts:15',message:'NotFoundException thrown',data:{id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n');}catch(e){}
      // #endregion
      throw new NotFoundException(`Capacitación con ID ${id} no encontrada`);
    }
    
    try {
      // Calcular promedio de calificaciones desde las reseñas
      if (capacitacion.inscripciones) {
        // Mapear reseñas con su inscripción para tener acceso al estudiante
        const todasLasResenas = capacitacion.inscripciones
          .flatMap((inscripcion) => 
            (inscripcion.resenas || [])
              .filter((resena) => resena.activo !== false)
              .map((resena) => ({
                resena,
                inscripcion, // Mantener referencia a la inscripción para acceder al estudiante
              }))
          );
        
        if (todasLasResenas.length > 0) {
          const sumaCalificaciones = todasLasResenas.reduce(
            (suma, item) => suma + item.resena.calificacion,
            0,
          );
          (capacitacion as any).promedioCalificacion = Number(
            (sumaCalificaciones / todasLasResenas.length).toFixed(2),
          );
        } else {
          (capacitacion as any).promedioCalificacion = 0;
        }
        
        // Agregar todas las reseñas a la capacitación para facilitar el acceso
        (capacitacion as any).resenas = todasLasResenas.map((item) => {
          try {
            return {
              id: item.resena.id,
              alumnoId: item.inscripcion?.estudiante?.id || null,
              calificacion: item.resena.calificacion,
              comentario: item.resena.comentario || null,
              fechaCreacion: item.resena.fechaCreacion 
                ? (typeof item.resena.fechaCreacion === 'string' 
                    ? item.resena.fechaCreacion 
                    : new Date(item.resena.fechaCreacion).toISOString())
                : new Date().toISOString(),
            };
          } catch (error) {
            console.error('Error mapeando reseña:', error, { resenaId: item.resena.id });
            // Retornar reseña básica sin alumnoId si hay error
            return {
              id: item.resena.id,
              alumnoId: null,
              calificacion: item.resena.calificacion,
              comentario: item.resena.comentario || null,
              fechaCreacion: item.resena.fechaCreacion 
                ? (typeof item.resena.fechaCreacion === 'string' 
                    ? item.resena.fechaCreacion 
                    : new Date(item.resena.fechaCreacion).toISOString())
                : new Date().toISOString(),
            };
          }
        });
      }
    } catch (error) {
      console.error('Error procesando reseñas en findOneCapacitacion:', error);
      // Si hay error procesando reseñas, continuar sin ellas pero loguear el error
      (capacitacion as any).promedioCalificacion = 0;
      (capacitacion as any).resenas = [];
    }
    
    return capacitacion;
  }
}
