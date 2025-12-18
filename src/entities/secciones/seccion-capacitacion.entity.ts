import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Capacitacion } from '../capacitacion/capacitacion.entity';
import { Leccion } from '../lecciones/leccion.entity';

@Entity('secciones_capacitacion')
export class SeccionCapacitacion {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(
    () => Capacitacion,
    (capacitacion: Capacitacion) => capacitacion.secciones,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'capacitacion_id' })
  capacitacion: Capacitacion;

  @Column({ type: 'varchar', length: 300 })
  titulo: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'int', default: 0 })
  orden: number;

  @Column({ type: 'tinyint', default: 1 })
  activo: boolean;

  @OneToMany(() => Leccion, (leccion: Leccion) => leccion.seccion)
  lecciones: Leccion[];
}
