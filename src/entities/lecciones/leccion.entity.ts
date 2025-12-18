import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { SeccionCapacitacion } from '../secciones/seccion-capacitacion.entity';
import { ProgresoLeccion } from '../progreso/progreso-leccion.entity';

@Entity('lecciones')
export class Leccion {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(
    () => SeccionCapacitacion,
    (seccion: SeccionCapacitacion) => seccion.lecciones,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'seccion_id' })
  seccion: SeccionCapacitacion;

  @Column({ type: 'varchar', length: 300 })
  titulo: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'longtext', nullable: true })
  contenido: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'video_url' })
  videoUrl: string;

  @Column({ type: 'int', nullable: true, name: 'duracion_minutos' })
  duracionMinutos: number;

  @Column({ type: 'int', default: 0 })
  orden: number;

  @Column({ type: 'tinyint', default: 1 })
  activo: boolean;

  @OneToMany(
    () => ProgresoLeccion,
    (progreso: ProgresoLeccion) => progreso.leccion,
  )
  progresos: ProgresoLeccion[];
}
