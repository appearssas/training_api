import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Empresa } from './empresa.entity';
import { Capacitacion } from '../capacitacion/capacitacion.entity';

/**
 * Asignación de cursos a una empresa (cliente institucional).
 * El admin asigna capacitaciones a una empresa; el cliente luego asigna esos cursos a sus usuarios (inscripciones).
 */
@Entity('capacitaciones_empresas')
@Unique(['empresaId', 'capacitacionId'])
export class CapacitacionEmpresa {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', name: 'empresa_id' })
  empresaId: number;

  @Column({ type: 'int', name: 'capacitacion_id' })
  capacitacionId: number;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @ManyToOne(() => Capacitacion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'capacitacion_id' })
  capacitacion: Capacitacion;

  /** Si false, los alumnos de esta empresa no pueden descargar el PDF del certificado de este curso. */
  @Column({
    type: 'tinyint',
    default: 1,
    name: 'permite_descarga_certificado',
  })
  permiteDescargaCertificado: boolean;

  @CreateDateColumn({ name: 'fecha_asignacion' })
  fechaAsignacion: Date;
}
