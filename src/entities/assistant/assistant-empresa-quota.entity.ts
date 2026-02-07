import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Empresa } from '../empresas/empresa.entity';

/**
 * Cuota mensual de tokens del asistente por empresa (cliente institucional).
 * Si no existe fila para una empresa, se usa el límite global (env).
 * token_quota_monthly = 0 → asistente no disponible para esa empresa.
 */
@Entity('assistant_empresa_quota')
export class AssistantEmpresaQuota {
  @PrimaryColumn({ type: 'int', name: 'empresa_id' })
  empresaId: number;

  @OneToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  /** Cuota de tokens por mes. 0 = sin acceso; null o no fila = usar límite global. */
  @Column({
    type: 'int',
    unsigned: true,
    default: 0,
    name: 'token_quota_monthly',
  })
  tokenQuotaMonthly: number;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: 'fecha_actualizacion' })
  fechaActualizacion: Date;
}
