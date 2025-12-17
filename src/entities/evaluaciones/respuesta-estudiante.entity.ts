import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { IntentoEvaluacion } from './intento-evaluacion.entity';
import { Pregunta } from './pregunta.entity';
import { OpcionRespuesta } from './opcion-respuesta.entity';
import { RespuestaMultiple } from './respuesta-multiple.entity';

@Entity('respuestas_estudiante')
export class RespuestaEstudiante {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => IntentoEvaluacion, (intento) => intento.respuestas, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'intento_evaluacion_id' })
  intentoEvaluacion: IntentoEvaluacion;

  @ManyToOne(() => Pregunta, (pregunta) => pregunta.respuestas)
  @JoinColumn({ name: 'pregunta_id' })
  pregunta: Pregunta;

  @ManyToOne(() => OpcionRespuesta, (opcion) => opcion.respuestasEstudiante, {
    nullable: true,
  })
  @JoinColumn({ name: 'opcion_respuesta_id' })
  opcionRespuesta: OpcionRespuesta;

  @Column({ type: 'text', nullable: true, name: 'texto_respuesta' })
  textoRespuesta: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
    name: 'puntaje_obtenido',
  })
  puntajeObtenido: number;

  @CreateDateColumn({ name: 'fecha_respuesta' })
  fechaRespuesta: Date;

  @OneToMany(() => RespuestaMultiple, (rm) => rm.respuestaEstudiante)
  respuestasMultiples: RespuestaMultiple[];
}
