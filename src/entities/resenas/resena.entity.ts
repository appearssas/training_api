import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { Inscripcion } from '../inscripcion/inscripcion.entity';

@Entity('resenas')
@Unique(['inscripcion'])
export class Resena {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(
    () => Inscripcion,
    (inscripcion: Inscripcion) => inscripcion.resenas,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'inscripcion_id' })
  inscripcion: Inscripcion;

  @Index()
  @Column({ type: 'tinyint' })
  calificacion: number;

  @Column({ type: 'text', nullable: true })
  comentario: string;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @Column({ type: 'tinyint', default: 1 })
  activo: boolean;
}
