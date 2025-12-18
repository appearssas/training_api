import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';
import { EstadoImportacion } from './types';

@Entity('logs_importacion')
export class LogImportacion {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'archivo_nombre',
  })
  archivoNombre: string;

  @Column({
    type: 'int',
    name: 'total_registros',
  })
  totalRegistros: number;

  @Column({
    type: 'int',
    default: 0,
    name: 'registros_exitosos',
  })
  registrosExitosos: number;

  @Column({
    type: 'int',
    default: 0,
    name: 'registros_fallidos',
  })
  registrosFallidos: number;

  @Column({ type: 'text', nullable: true })
  errores: string;

  @Index()
  @Column({
    type: 'enum',
    enum: EstadoImportacion,
    default: EstadoImportacion.EN_PROCESO,
  })
  estado: EstadoImportacion;

  @Index()
  @CreateDateColumn({ name: 'fecha_inicio' })
  fechaInicio: Date;

  @Column({
    type: 'datetime',
    nullable: true,
    name: 'fecha_fin',
  })
  fechaFin: Date;
}
