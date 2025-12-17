import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Evaluacion } from './evaluacion.entity';
import { TipoPregunta } from '../catalogos/tipo-pregunta.entity';
import { OpcionRespuesta } from './opcion-respuesta.entity';
import { RespuestaEstudiante } from './respuesta-estudiante.entity';

@Entity('preguntas')
export class Pregunta {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Evaluacion, (evaluacion) => evaluacion.preguntas, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'evaluacion_id' })
  evaluacion: Evaluacion;

  @ManyToOne(() => TipoPregunta, { eager: true })
  @JoinColumn({ name: 'tipo_pregunta_id' })
  tipoPregunta: TipoPregunta;

  @Column({ type: 'text' })
  enunciado: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 1.0 })
  puntaje: number;

  @Column({ type: 'int', default: 0 })
  orden: number;

  @Column({ type: 'tinyint', default: 1 })
  requerida: boolean;

  @Column({ type: 'tinyint', default: 1 })
  activo: boolean;

  @OneToMany(() => OpcionRespuesta, (opcion) => opcion.pregunta)
  opciones: OpcionRespuesta[];

  @OneToMany(() => RespuestaEstudiante, (respuesta) => respuesta.pregunta)
  respuestas: RespuestaEstudiante[];
}
