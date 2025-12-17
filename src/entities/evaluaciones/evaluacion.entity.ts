import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Capacitacion } from '../capacitacion.entity';
import { Pregunta } from './pregunta.entity';
import { IntentoEvaluacion } from './intento-evaluacion.entity';

@Entity('evaluaciones')
export class Evaluacion {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Capacitacion, (capacitacion) => capacitacion.evaluaciones, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'capacitacion_id' })
  capacitacion: Capacitacion;

  @Column({ type: 'varchar', length: 300 })
  titulo: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'int', nullable: true, name: 'tiempo_limite_minutos' })
  tiempoLimiteMinutos: number;

  @Column({ type: 'int', default: 1, name: 'intentos_permitidos' })
  intentosPermitidos: number;

  @Column({ type: 'tinyint', default: 1, name: 'mostrar_resultados' })
  mostrarResultados: boolean;

  @Column({ type: 'tinyint', default: 0, name: 'mostrar_respuestas_correctas' })
  mostrarRespuestasCorrectas: boolean;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 100.0,
    name: 'puntaje_total',
  })
  puntajeTotal: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 70.0,
    name: 'minimo_aprobacion',
  })
  minimoAprobacion: number;

  @Column({ type: 'int', default: 0 })
  orden: number;

  @Column({ type: 'tinyint', default: 1 })
  activo: boolean;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @OneToMany(() => Pregunta, (pregunta) => pregunta.evaluacion)
  preguntas: Pregunta[];

  @OneToMany(() => IntentoEvaluacion, (intento) => intento.evaluacion)
  intentos: IntentoEvaluacion[];
}
