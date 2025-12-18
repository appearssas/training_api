import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Persona } from '../persona/persona.entity';

@Entity('instructores')
export class Instructor {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Persona, (persona: Persona) => persona.instructor, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'persona_id' })
  persona: Persona;

  @Column({ type: 'varchar', length: 200, nullable: true })
  especialidad: string;

  @Column({ type: 'text', nullable: true })
  biografia: string;

  @Column({
    type: 'decimal',
    precision: 3,
    scale: 2,
    nullable: true,
    name: 'calificacion_promedio',
  })
  calificacionPromedio: number;

  @Column({ type: 'int', default: 0, name: 'total_capacitaciones' })
  totalCapacitaciones: number;

  @Column({ type: 'int', default: 0, name: 'total_estudiantes' })
  totalEstudiantes: number;

  @Column({ type: 'tinyint', default: 1 })
  activo: boolean;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: 'fecha_actualizacion' })
  fechaActualizacion: Date;
}
