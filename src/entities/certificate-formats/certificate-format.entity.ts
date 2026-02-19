import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/** Tipo de certificado (alimentos/sustancias/otros). Usado en API y maestra de cursos. */
export enum CertificateFormatType {
  ALIMENTOS = 'alimentos',
  SUSTANCIAS = 'sustancias',
  OTROS = 'otros',
}

@Entity('certificate_formats')
export class CertificateFormat {
  @PrimaryGeneratedColumn()
  id: number;

  /** Configuración PDF única del formato (posiciones, fuentes, etc.). Un solo config por formato. */
  @Column({
    type: 'json',
    nullable: true,
    name: 'config',
  })
  config: any;

  /** Ruta o URL del PNG de fondo (storage/certificates o S3). Un solo fondo por formato. */
  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    name: 'fondo_path',
  })
  fondoPath: string | null;

  @Column({
    type: 'tinyint',
    default: 1,
    name: 'activo',
  })
  activo: boolean;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: 'fecha_actualizacion' })
  fechaActualizacion: Date;
}
