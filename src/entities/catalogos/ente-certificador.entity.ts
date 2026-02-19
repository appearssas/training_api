import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Capacitacion } from '../capacitacion/capacitacion.entity';
import { Representante } from './representante.entity';
import { CertificateFormat } from '../certificate-formats/certificate-format.entity';

/**
 * Catálogo de entes certificadores (ej. ministerio, secretaría de tránsito).
 * Se asocia a capacitaciones para indicar quién certifica el curso.
 */
@Entity('entes_certificadores')
export class EnteCertificador {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 200 })
  nombre: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  codigo: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    name: 'informacion_contacto',
  })
  informacionContacto: string;

  /** Ruta del logo (ej: catalogos/entes/1/logo.png). Servido bajo /storage/... */
  @Column({ type: 'varchar', length: 500, nullable: true, name: 'logo_path' })
  logoPath: string | null;

  @Column({ type: 'tinyint', default: 1 })
  activo: boolean;

  /** Formato de certificado asignado a este ente (layout y fondos). Si es null, se usa el formato activo global. */
  @Column({ type: 'int', nullable: true, name: 'certificate_format_id' })
  certificateFormatId: number | null;

  @ManyToOne(() => CertificateFormat, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'certificate_format_id' })
  certificateFormat: CertificateFormat | null;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: 'fecha_actualizacion' })
  fechaActualizacion: Date;

  @OneToMany(
    () => Capacitacion,
    (capacitacion: Capacitacion) => capacitacion.enteCertificador,
  )
  capacitaciones: Capacitacion[];

  @OneToMany(() => Representante, (rep: Representante) => rep.enteCertificador)
  representantes: Representante[];
}
