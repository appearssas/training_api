import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { MaterialCapacitacion } from '../material-capacitacion.entity';

@Entity('tipos_material')
export class TipoMaterial {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  codigo: string;

  @Column({ type: 'tinyint', default: 1 })
  activo: boolean;

  @OneToMany(() => MaterialCapacitacion, (material) => material.tipoMaterial)
  materiales: MaterialCapacitacion[];
}
