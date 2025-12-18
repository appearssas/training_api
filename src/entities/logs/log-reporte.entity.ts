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
import { FormatoReporte } from './types';

@Entity('logs_reportes')
export class LogReporte {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Index()
  @Column({
    type: 'varchar',
    length: 100,
    name: 'tipo_reporte',
  })
  tipoReporte: string;

  @Column({ type: 'text', nullable: true })
  filtros: string;

  @Column({
    type: 'enum',
    enum: FormatoReporte,
    default: FormatoReporte.PDF,
  })
  formato: FormatoReporte;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    name: 'ruta_archivo',
  })
  rutaArchivo: string;

  @Index()
  @CreateDateColumn({ name: 'fecha_generacion' })
  fechaGeneracion: Date;
}
