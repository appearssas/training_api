import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Persona } from '../persona/persona.entity';
import { Capacitacion } from '../capacitacion/capacitacion.entity';

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

  /** Rol mostrado en certificado (ej: Instructor / Entrenador). */
  @Column({ type: 'varchar', length: 200, nullable: true, name: 'rol' })
  rol: string | null;

  /** Tarjeta profesional (ej: TSA RM 30937322). */
  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
    name: 'tarjeta_profesional',
  })
  tarjetaProfesional: string | null;

  /** Licencia (ej: Licencia SST). */
  @Column({ type: 'varchar', length: 200, nullable: true, name: 'licencia' })
  licencia: string | null;

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

  @OneToMany(
    () => Capacitacion,
    (capacitacion: Capacitacion) => capacitacion.instructor,
  )
  capacitaciones: Capacitacion[];
}
