import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Inscripcion } from './inscripcion.entity';
import { Leccion } from './leccion.entity';

@Entity('progreso_lecciones')
@Unique(['inscripcion', 'leccion'])
export class ProgresoLeccion {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(
    () => Inscripcion,
    (inscripcion) => inscripcion.progresoLecciones,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'inscripcion_id' })
  inscripcion: Inscripcion;

  @ManyToOne(() => Leccion, (leccion) => leccion.progresos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'leccion_id' })
  leccion: Leccion;

  @Column({ type: 'tinyint', default: 0 })
  completada: boolean;

  @Column({ type: 'datetime', nullable: true, name: 'fecha_inicio' })
  fechaInicio: Date;

  @Column({ type: 'datetime', nullable: true, name: 'fecha_completada' })
  fechaCompletada: Date;

  @Column({ type: 'int', default: 0, name: 'tiempo_dedicado_minutos' })
  tiempoDedicadoMinutos: number;
}
