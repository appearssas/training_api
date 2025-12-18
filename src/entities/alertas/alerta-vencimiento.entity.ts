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

@Entity('alertas_vencimiento')
export class AlertaVencimiento {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Certificado, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'certificado_id' })
  certificado: Certificado;

  @Column({
    type: 'int',
    name: 'dias_restantes',
  })
  diasRestantes: number;

  @Index()
  @CreateDateColumn({ name: 'fecha_envio' })
  fechaEnvio: Date;

  @Column({ type: 'tinyint', default: 0 })
  enviado: boolean;

  @Index()
  @Column({
    type: 'date',
    name: 'fecha_vencimiento',
  })
  fechaVencimiento: Date;
}
