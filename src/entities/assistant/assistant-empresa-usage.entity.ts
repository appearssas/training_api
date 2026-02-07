import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Empresa } from '../empresas/empresa.entity';

/**
 * Uso de tokens del asistente por empresa y mes (YYYY-MM).
 * Una fila por empresa por mes.
 */
@Entity('assistant_empresa_usage')
@Index(['empresaId', 'month'], { unique: true })
export class AssistantEmpresaUsage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', name: 'empresa_id' })
  empresaId: number;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  /** Mes en formato YYYY-MM */
  @Column({ type: 'varchar', length: 7 })
  month: string;

  @Column({ type: 'int', unsigned: true, default: 0, name: 'tokens_used' })
  tokensUsed: number;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;
}
