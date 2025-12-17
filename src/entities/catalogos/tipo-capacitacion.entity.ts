import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Capacitacion } from '../capacitacion/capacitacion.entity';

@Entity('tipos_capacitacion')
export class TipoCapacitacion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  codigo: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'tinyint', default: 1 })
  activo: boolean;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: 'fecha_actualizacion' })
  fechaActualizacion: Date;

  @OneToMany(
    () => Capacitacion,
    (capacitacion: Capacitacion) => capacitacion.tipoCapacitacion,
  )
  capacitaciones: Capacitacion[];
}
