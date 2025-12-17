import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Pregunta } from './pregunta.entity';
import { RespuestaEstudiante } from './respuesta-estudiante.entity';
import { RespuestaMultiple } from './respuesta-multiple.entity';

@Entity('opciones_respuesta')
export class OpcionRespuesta {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Pregunta, (pregunta) => pregunta.opciones, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'pregunta_id' })
  pregunta: Pregunta;

  @Column({ type: 'varchar', length: 1000 })
  texto: string;

  @Column({ type: 'tinyint', default: 0, name: 'es_correcta' })
  esCorrecta: boolean;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
    name: 'puntaje_parcial',
  })
  puntajeParcial: number;

  @Column({ type: 'int', default: 0 })
  orden: number;

  @OneToMany(
    () => RespuestaEstudiante,
    (respuesta) => respuesta.opcionRespuesta,
  )
  respuestasEstudiante: RespuestaEstudiante[];

  @OneToMany(() => RespuestaMultiple, (rm) => rm.opcionRespuesta)
  respuestasMultiples: RespuestaMultiple[];
}
