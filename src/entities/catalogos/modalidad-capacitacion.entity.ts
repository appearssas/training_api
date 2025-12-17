import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Capacitacion } from '../capacitacion/capacitacion.entity';

@Entity('modalidades_capacitacion')
export class ModalidadCapacitacion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  nombre: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  codigo: string;

  @Column({ type: 'tinyint', default: 1 })
  activo: boolean;

  @OneToMany(
    () => Capacitacion,
    (capacitacion: Capacitacion) => capacitacion.modalidad,
  )
  capacitaciones: Capacitacion[];
}
