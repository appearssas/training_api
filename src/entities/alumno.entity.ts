import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Persona } from './persona.entity';

@Entity('alumnos')
export class Alumno {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Persona, (persona) => persona.alumno, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'persona_id' })
  persona: Persona;

  @Index()
  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    unique: true,
    name: 'codigo_estudiante',
  })
  codigoEstudiante: string;

  @Column({ type: 'date', nullable: true, name: 'fecha_ingreso' })
  fechaIngreso: Date;

  @Column({ type: 'tinyint', default: 1 })
  activo: boolean;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;
}
