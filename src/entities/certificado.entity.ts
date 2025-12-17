import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Inscripcion } from './inscripcion.entity';

@Entity('certificados')
export class Certificado {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Inscripcion, (inscripcion) => inscripcion.certificados, {
    onDelete: 'CASCADE',
  })
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

  @Column({ type: 'date', nullable: true, name: 'fecha_vencimiento' })
  fechaVencimiento: Date;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    name: 'url_certificado',
  })
  urlCertificado: string;

  @Index()
  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'hash_verificacion',
  })
  hashVerificacion: string;

  @Column({ type: 'tinyint', default: 1 })
  activo: boolean;
}
