import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Capacitacion } from './capacitacion.entity';
import { Persona } from './persona.entity';
import { ProgresoLeccion } from './progreso-leccion.entity';
import { IntentoEvaluacion } from './evaluaciones/intento-evaluacion.entity';
import { Certificado } from './certificado.entity';
import { Resena } from './resena.entity';

export enum EstadoInscripcion {
  INSCRITO = 'inscrito',
  EN_PROGRESO = 'en_progreso',
  COMPLETADO = 'completado',
  ABANDONADO = 'abandonado',
}

@Entity('inscripciones')
export class Inscripcion {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Capacitacion, (capacitacion) => capacitacion.inscripciones, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'capacitacion_id' })
  capacitacion: Capacitacion;

  @ManyToOne(() => Persona, (persona) => persona.inscripciones)
  @JoinColumn({ name: 'estudiante_id' })
  estudiante: Persona;

  @CreateDateColumn({ name: 'fecha_inscripcion' })
  fechaInscripcion: Date;

  @Column({ type: 'datetime', nullable: true, name: 'fecha_inicio' })
  fechaInicio: Date;

  @Column({ type: 'datetime', nullable: true, name: 'fecha_finalizacion' })
  fechaFinalizacion: Date;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0.0,
    name: 'progreso_porcentaje',
  })
  progresoPorcentaje: number;

  @Column({
    type: 'enum',
    enum: EstadoInscripcion,
    default: EstadoInscripcion.INSCRITO,
  })
  estado: EstadoInscripcion;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    name: 'calificacion_final',
  })
  calificacionFinal: number;

  @Column({ type: 'tinyint', nullable: true })
  aprobado: boolean;

  @OneToMany(() => ProgresoLeccion, (progreso) => progreso.inscripcion)
  progresoLecciones: ProgresoLeccion[];

  @OneToMany(() => IntentoEvaluacion, (intento) => intento.inscripcion)
  intentosEvaluacion: IntentoEvaluacion[];

  @OneToMany(() => Certificado, (certificado) => certificado.inscripcion)
  certificados: Certificado[];

  @OneToMany(() => Resena, (resena) => resena.inscripcion)
  resenas: Resena[];
}
