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

  /** Ruta de la imagen de firma (ej: catalogos/instructores/1/firma.png). Servido bajo /storage/... */
  @Column({ type: 'varchar', length: 500, nullable: true, name: 'firma_path' })
  firmaPath: string | null;

  @Column({ type: 'tinyint', default: 1 })
  activo: boolean;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: 'fecha_actualizacion' })
  fechaActualizacion: Date;
}
