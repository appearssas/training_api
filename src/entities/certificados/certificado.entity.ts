import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Inscripcion } from '../inscripcion/inscripcion.entity';

@Entity('certificados')
export class Certificado {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(
    () => Inscripcion,
    (inscripcion: Inscripcion) => inscripcion.certificados,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'inscripcion_id' })
  inscripcion: Inscripcion;

  @Column({
    type: 'varchar',
    length: 100,
    unique: true,
    name: 'numero_certificado',
  })
  numeroCertificado: string;

  @CreateDateColumn({ name: 'fecha_emision' })
  fechaEmision: Date;

  @Column({
    type: 'datetime',
    nullable: true,
    name: 'fecha_aprobacion_real',
  })
  fechaAprobacionReal: Date;

  @Column({
    type: 'datetime',
    nullable: true,
    name: 'fecha_retroactiva',
  })
  fechaRetroactiva: Date | null;

  @Column({
    type: 'tinyint',
    default: 0,
    name: 'es_retroactivo',
  })
  esRetroactivo: boolean;

  @Column({
    type: 'text',
    nullable: true,
    name: 'justificacion_retroactiva',
  })
  justificacionRetroactiva: string | null;

  @Column({ type: 'date', nullable: true, name: 'fecha_vencimiento' })
  fechaVencimiento: Date;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    name: 'url_certificado',
  })
  urlCertificado: string;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    name: 'url_verificacion_publica',
  })
  urlVerificacionPublica: string;

  @Index()
  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'hash_verificacion',
  })
  hashVerificacion: string;

  @Column({
    type: 'text',
    nullable: true,
    name: 'codigo_qr',
  })
  codigoQr: string;

  @Column({
    type: 'text',
    nullable: true,
    name: 'firma_digital',
  })
  firmaDigital: string;

  @Column({ type: 'tinyint', default: 1 })
  activo: boolean;
}
