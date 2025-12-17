import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { RespuestaEstudiante } from './respuesta-estudiante.entity';
import { OpcionRespuesta } from './opcion-respuesta.entity';

@Entity('respuestas_multiples')
@Unique(['respuestaEstudiante', 'opcionRespuesta'])
export class RespuestaMultiple {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(
    () => RespuestaEstudiante,
    (respuesta: RespuestaEstudiante) => respuesta.respuestasMultiples,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'respuesta_estudiante_id' })
  respuestaEstudiante: RespuestaEstudiante;

  @ManyToOne(
    () => OpcionRespuesta,
    (opcion: OpcionRespuesta) => opcion.respuestasMultiples,
  )
  @JoinColumn({ name: 'opcion_respuesta_id' })
  opcionRespuesta: OpcionRespuesta;
}
