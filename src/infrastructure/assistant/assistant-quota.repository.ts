import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssistantEmpresaQuota } from '@/entities/assistant/assistant-empresa-quota.entity';
import { AssistantEmpresaUsage } from '@/entities/assistant/assistant-empresa-usage.entity';
import { Empresa } from '@/entities/empresas/empresa.entity';

@Injectable()
export class AssistantQuotaRepository {
  constructor(
    @InjectRepository(AssistantEmpresaQuota)
    private readonly quotaRepo: Repository<AssistantEmpresaQuota>,
    @InjectRepository(AssistantEmpresaUsage)
    private readonly usageRepo: Repository<AssistantEmpresaUsage>,
    @InjectRepository(Empresa)
    private readonly empresaRepo: Repository<Empresa>,
  ) {}

  private currentMonth(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  /** Cuota configurada para la empresa. null = no fila = usar límite global. */
  async getQuota(empresaId: number): Promise<number | null> {
    const row = await this.quotaRepo.findOne({ where: { empresaId } });
    return row ? row.tokenQuotaMonthly : null;
  }

  /** Asignar cuota mensual (0 = sin acceso). Crea o actualiza. */
  async setQuota(empresaId: number, tokenQuotaMonthly: number): Promise<void> {
    await this.quotaRepo.upsert(
      { empresaId, tokenQuotaMonthly },
      { conflictPaths: ['empresaId'] },
    );
  }

  /** Tokens usados por la empresa en el mes actual. */
  async getUsage(empresaId: number, month?: string): Promise<number> {
    const m = month ?? this.currentMonth();
    const row = await this.usageRepo.findOne({
      where: { empresaId, month: m },
    });
    return row?.tokensUsed ?? 0;
  }

  /** Incrementar tokens usados en el mes actual. */
  async incrementUsage(empresaId: number, tokens: number): Promise<void> {
    const m = this.currentMonth();
    const existing = await this.usageRepo.findOne({
      where: { empresaId, month: m },
    });
    if (existing) {
      existing.tokensUsed += tokens;
      await this.usageRepo.save(existing);
    } else {
      await this.usageRepo.save({
        empresaId,
        month: m,
        tokensUsed: tokens,
      });
    }
  }

  /** Listado para admin: todas las empresas activas no eliminadas con cuota y uso del mes actual. tokenQuotaMonthly null = sin asignar (usa límite global). */
  async listQuotasWithUsage(): Promise<
    {
      empresaId: number;
      razonSocial: string;
      tokenQuotaMonthly: number | null;
      tokensUsed: number;
    }[]
  > {
    const empresas = await this.empresaRepo.find({
      where: { activo: true, eliminada: false },
      order: { razonSocial: 'ASC' },
    });
    const month = this.currentMonth();
    const quotas = await this.quotaRepo.find();
    const quotaMap = new Map(
      quotas.map(q => [q.empresaId, q.tokenQuotaMonthly]),
    );
    const result: {
      empresaId: number;
      razonSocial: string;
      tokenQuotaMonthly: number | null;
      tokensUsed: number;
    }[] = [];
    for (const e of empresas) {
      const tokenQuotaMonthly = quotaMap.get(e.id) ?? null;
      const tokensUsed = await this.getUsage(e.id, month);
      result.push({
        empresaId: e.id,
        razonSocial: e.razonSocial,
        tokenQuotaMonthly,
        tokensUsed,
      });
    }
    return result;
  }
}
