import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { EnteCertificador } from './ente-certificador.entity';

/**
 * Representante legal o de contacto de un ente certificador.
 * Cada ente (escuela de certificación) tiene sus representantes; se usa en certificados (firma y nombre).
 */
@Entity('representantes')
export class Representante {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', name: 'ente_certificador_id', nullable: true })
  enteCertificadorId: number | null;

  @ManyToOne(() => EnteCertificador, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ente_certificador_id' })
  enteCertificador?: EnteCertificador;

  @Column({ type: 'varchar', length: 200 })
  nombre: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  cargo: string | null;

  /** Ruta de la imagen de firma (ej: catalogos/representantes/1/firma.png). Servido bajo /storage/... */
  @Column({ type: 'varchar', length: 500, nullable: true, name: 'firma_path' })
  firmaPath: string | null;

  @Column({ type: 'tinyint', default: 1 })
  activo: boolean;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: 'fecha_actualizacion' })
  fechaActualizacion: Date;
}
