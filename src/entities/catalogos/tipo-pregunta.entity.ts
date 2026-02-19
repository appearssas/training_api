import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Pregunta } from '../evaluaciones/pregunta.entity';

@Entity('tipos_pregunta')
export class TipoPregunta {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  codigo: string;

  @Column({ type: 'tinyint', default: 0, name: 'permite_multiple_respuesta' })
  permiteMultipleRespuesta: boolean;

  @Column({ type: 'tinyint', default: 0, name: 'requiere_texto_libre' })
  requiereTextoLibre: boolean;

  @Column({ type: 'tinyint', default: 1 })
  activo: boolean;

  @OneToMany(() => Pregunta, pregunta => pregunta.tipoPregunta)
  preguntas: Pregunta[];
}
