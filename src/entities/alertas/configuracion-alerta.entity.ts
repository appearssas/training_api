import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('configuracion_alertas')
export class ConfiguracionAlerta {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'int',
    unique: true,
    name: 'dias_antes_vencimiento',
  })
  diasAntesVencimiento: number;

  @Column({ type: 'tinyint', default: 1 })
  activo: boolean;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;
}
