import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { TipoCapacitacion } from './catalogos/tipo-capacitacion.entity';
import { ModalidadCapacitacion } from './catalogos/modalidad-capacitacion.entity';
import { Persona } from './persona.entity';
import { MaterialCapacitacion } from './material-capacitacion.entity';
import { SeccionCapacitacion } from './seccion-capacitacion.entity';
import { Evaluacion } from './evaluaciones/evaluacion.entity';
import { Inscripcion } from './inscripcion.entity';

export enum EstadoCapacitacion {
  BORRADOR = 'borrador',
  PUBLICADA = 'publicada',
  EN_CURSO = 'en_curso',
  FINALIZADA = 'finalizada',
  CANCELADA = 'cancelada',
}

@Entity('capacitaciones')
export class Capacitacion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 500 })
  titulo: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @ManyToOne(() => TipoCapacitacion, { eager: true })
  @JoinColumn({ name: 'tipo_capacitacion_id' })
  tipoCapacitacion: TipoCapacitacion;

  @ManyToOne(() => ModalidadCapacitacion, { eager: true })
  @JoinColumn({ name: 'modalidad_id' })
  modalidad: ModalidadCapacitacion;

  @ManyToOne(() => Persona, { eager: true })
  @JoinColumn({ name: 'instructor_id' })
  instructor: Persona;

  @Column({ type: 'int', nullable: true, name: 'area_id' })
  areaId: number;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
    name: 'publico_objetivo',
  })
  publicoObjetivo: string;

  @Column({ type: 'date', nullable: true, name: 'fecha_inicio' })
  fechaInicio: Date;

  @Column({ type: 'date', nullable: true, name: 'fecha_fin' })
  fechaFin: Date;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    name: 'duracion_horas',
  })
  duracionHoras: number;

  @Column({ type: 'int', nullable: true, name: 'capacidad_maxima' })
  capacidadMaxima: number;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    name: 'imagen_portada_url',
  })
  imagenPortadaUrl: string;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    name: 'video_promocional_url',
  })
  videoPromocionalUrl: string;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 70.0,
    name: 'minimo_aprobacion',
  })
  minimoAprobacion: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    name: 'porcentaje_eficacia',
  })
  porcentajeEficacia: number;

  @Column({
    type: 'enum',
    enum: EstadoCapacitacion,
    default: EstadoCapacitacion.BORRADOR,
  })
  estado: EstadoCapacitacion;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: 'fecha_actualizacion' })
  fechaActualizacion: Date;

  @Column({ type: 'varchar', length: 50, name: 'usuario_creacion' })
  usuarioCreacion: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'usuario_actualizacion',
  })
  usuarioActualizacion: string;

  @OneToMany(() => MaterialCapacitacion, (material) => material.capacitacion)
  materiales: MaterialCapacitacion[];

  @OneToMany(() => SeccionCapacitacion, (seccion) => seccion.capacitacion)
  secciones: SeccionCapacitacion[];

  @OneToMany(() => Evaluacion, (evaluacion) => evaluacion.capacitacion)
  evaluaciones: Evaluacion[];

  @OneToMany(() => Inscripcion, (inscripcion) => inscripcion.capacitacion)
  inscripciones: Inscripcion[];
}
