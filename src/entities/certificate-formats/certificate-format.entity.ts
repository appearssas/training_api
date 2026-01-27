import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum CertificateFormatType {
  ALIMENTOS = 'alimentos',
  SUSTANCIAS = 'sustancias',
  OTROS = 'otros',
}

@Entity('certificate_formats')
export class CertificateFormat {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({
    type: 'enum',
    enum: CertificateFormatType,
    name: 'tipo',
  })
  tipo: CertificateFormatType;

  @Column({
    type: 'json',
    nullable: true,
    name: 'config_alimentos',
  })
  configAlimentos: any;

  @Column({
    type: 'json',
    nullable: true,
    name: 'config_sustancias',
  })
  configSustancias: any;

  @Column({
    type: 'json',
    nullable: true,
    name: 'config_otros',
  })
  configOtros: any;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'fondo_alimentos_path',
    comment: 'Ruta del archivo PNG de fondo para alimentos',
  })
  fondoAlimentosPath: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'fondo_sustancias_path',
    comment: 'Ruta del archivo PNG de fondo para sustancias',
  })
  fondoSustanciasPath: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'fondo_general_path',
    comment: 'Ruta del archivo PNG de fondo general/otros',
  })
  fondoGeneralPath: string | null;

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
