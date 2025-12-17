import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Evaluacion } from './evaluacion.entity';
import { Inscripcion } from '../inscripcion/inscripcion.entity';
import { RespuestaEstudiante } from './respuesta-estudiante.entity';
import { EstadoIntento } from './types';

@Entity('intentos_evaluacion')
export class IntentoEvaluacion {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Evaluacion, (evaluacion: Evaluacion) => evaluacion.intentos)
  @JoinColumn({ name: 'evaluacion_id' })
  evaluacion: Evaluacion;

  @ManyToOne(
    () => Inscripcion,
    (inscripcion: Inscripcion) => inscripcion.intentosEvaluacion,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'inscripcion_id' })
  inscripcion: Inscripcion;

  @Column({ type: 'int', default: 1, name: 'numero_intento' })
  numeroIntento: number;

  @CreateDateColumn({ name: 'fecha_inicio' })
  fechaInicio: Date;

  @Column({ type: 'datetime', nullable: true, name: 'fecha_finalizacion' })
  fechaFinalizacion: Date;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
    name: 'puntaje_obtenido',
  })
  puntajeObtenido: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'puntaje_total',
  })
  puntajeTotal: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  porcentaje: number;

  @Column({ type: 'tinyint', nullable: true })
  aprobado: boolean;

  @Column({ type: 'int', nullable: true, name: 'tiempo_utilizado_minutos' })
  tiempoUtilizadoMinutos: number;

  @Column({
    type: 'enum',
    enum: EstadoIntento,
    default: EstadoIntento.EN_PROGRESO,
  })
  estado: EstadoIntento;

  @OneToMany(
    () => RespuestaEstudiante,
    (respuesta: RespuestaEstudiante) => respuesta.intentoEvaluacion,
  )
  respuestas: RespuestaEstudiante[];
}
