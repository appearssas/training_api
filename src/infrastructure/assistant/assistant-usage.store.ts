import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

export interface AssistantUsageData {
  /** Mes actual (YYYY-MM). Si cambia, se reinicia totalTokens. */
  month: string;
  /** Tokens consumidos en el mes. */
  totalTokens: number;
  /** Día actual (YYYY-MM-DD). Si cambia, se reinicia requestsToday. */
  day: string;
  /** Peticiones en el día actual. */
  requestsToday: number;
}

const DEFAULT_FILENAME = 'assistant-usage.json';

@Injectable()
export class AssistantUsageStore {
  private readonly logger = new Logger(AssistantUsageStore.name);
  private writeLock: Promise<void> = Promise.resolve();

  constructor(private readonly configService: ConfigService) {}

  private getFilePath(): string {
    const base =
      this.configService.get<string>('STORAGE_PATH') ||
      join(process.cwd(), 'storage');
    return join(base, DEFAULT_FILENAME);
  }

  private now(): { month: string; day: string } {
    const d = new Date();
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { month, day };
  }

  /** Carga datos desde disco y reinicia contadores si cambió el mes o el día. */
  load(): AssistantUsageData {
    const { month, day } = this.now();
    const filePath = this.getFilePath();
    const data: AssistantUsageData = {
      month,
      day,
      totalTokens: 0,
      requestsToday: 0,
    };

    if (existsSync(filePath)) {
      try {
        const raw = readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(raw) as AssistantUsageData;
        if (parsed.month === month) {
          data.totalTokens = parsed.totalTokens ?? 0;
        }
        if (parsed.day === day) {
          data.requestsToday = parsed.requestsToday ?? 0;
        }
      } catch {
        this.logger.warn(
          'No se pudo leer assistant-usage.json, se usa valor por defecto',
        );
      }
    }
    return data;
  }

  /** Guarda datos en disco (serializado con un lock simple). */
  private save(data: AssistantUsageData): void {
    const filePath = this.getFilePath();
    const dir = join(filePath, '..');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    try {
      writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      this.logger.error('Error guardando assistant-usage.json', e);
    }
  }

  /**
   * Comprueba si se superaron los límites. Lanza si no se puede continuar.
   */
  checkLimits(monthlyTokenLimit: number, dailyRequestLimit: number): void {
    if (monthlyTokenLimit <= 0 && dailyRequestLimit <= 0) return;

    const data = this.load();
    if (monthlyTokenLimit > 0 && data.totalTokens >= monthlyTokenLimit) {
      throw new Error(
        'ASSISTANT_LIMIT_REACHED: Se alcanzó el límite mensual de tokens del asistente. No se realizarán más peticiones hasta el próximo mes para evitar facturación.',
      );
    }
    if (dailyRequestLimit > 0 && data.requestsToday >= dailyRequestLimit) {
      throw new Error(
        'ASSISTANT_LIMIT_REACHED: Se alcanzó el límite diario de peticiones del asistente. Vuelve a intentar mañana.',
      );
    }
  }

  /**
   * Registra una petición exitosa (tokens consumidos) y persiste.
   */
  recordRequest(tokensUsed: number): void {
    const { month, day } = this.now();
    const data = this.load();
    if (data.month !== month) {
      data.month = month;
      data.totalTokens = 0;
    }
    if (data.day !== day) {
      data.day = day;
      data.requestsToday = 0;
    }
    data.totalTokens += tokensUsed;
    data.requestsToday += 1;
    this.save(data);
  }
}
