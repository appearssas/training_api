import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Certificado } from '../certificados/certificado.entity';
import { Usuario } from '../usuarios/usuario.entity';

@Entity('auditoria_certificados_retroactivos')
export class AuditoriaCertificadoRetroactivo {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Certificado, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'certificado_id' })
  certificado: Certificado;

  @Column({
    type: 'datetime',
    name: 'fecha_aprobacion_real',
  })
  fechaAprobacionReal: Date;

  @Column({
    type: 'datetime',
    name: 'fecha_retroactiva',
  })
  fechaRetroactiva: Date;

  @Column({ type: 'text' })
  justificacion: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'emitido_por' })
  emitidoPor: Usuario;

  @Index()
  @CreateDateColumn({ name: 'fecha_emision' })
  fechaEmision: Date;
}
