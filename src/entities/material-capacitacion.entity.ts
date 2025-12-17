import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Capacitacion } from './capacitacion.entity';
import { TipoMaterial } from './catalogos/tipo-material.entity';

@Entity('materiales_capacitacion')
export class MaterialCapacitacion {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Capacitacion, (capacitacion) => capacitacion.materiales, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'capacitacion_id' })
  capacitacion: Capacitacion;

  @ManyToOne(() => TipoMaterial, { eager: true })
  @JoinColumn({ name: 'tipo_material_id' })
  tipoMaterial: TipoMaterial;

  @Column({ type: 'varchar', length: 200 })
  nombre: string;

  @Column({ type: 'varchar', length: 1000 })
  url: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'int', default: 0 })
  orden: number;

  @Column({ type: 'tinyint', default: 1 })
  activo: boolean;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;
}
