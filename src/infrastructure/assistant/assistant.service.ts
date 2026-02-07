import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PLATFORM_KNOWLEDGE } from './platform-knowledge';
import { AssistantUsageStore } from './assistant-usage.store';
import { AssistantQuotaRepository } from './assistant-quota.repository';
import type { Usuario } from '@/entities/usuarios/usuario.entity';
import { Empresa } from '@/entities/empresas/empresa.entity';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

const OPENAI_DEFAULT_MODEL = 'gpt-4o-mini';
const PERPLEXITY_DEFAULT_MODEL = 'sonar'; // económico; "sonar-pro" para más capacidad
const GEMINI_DEFAULT_MODEL = 'gemini-1.5-flash'; // free tier

const QUOTA_CONTACT_MESSAGE =
  ' Para adquirir más, contacte al administrador del sistema.';

@Injectable()
export class AssistantService {
  private readonly logger = new Logger(AssistantService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly usageStore: AssistantUsageStore,
    private readonly quotaRepo: AssistantQuotaRepository,
    @InjectRepository(Empresa)
    private readonly empresaRepo: Repository<Empresa>,
  ) {}

  async chat(userMessage: string, user?: Usuario): Promise<string> {
    await this.assertWithinLimits(user);

    const order = this.configService
      .get<string>('ASSISTANT_PROVIDER_ORDER')
      ?.toLowerCase()
      .split(',')
      .map(s => s.trim()) ?? ['perplexity', 'openai', 'gemini'];
    const perplexityKey = this.configService.get<string>('PERPLEXITY_API_KEY');
    const openaiKey = this.configService.get<string>('OPENAI_API_KEY');
    const geminiKey = this.configService.get<string>('GEMINI_API_KEY');

    let lastError: Error | null = null;
    for (const provider of order) {
      try {
        if (provider === 'perplexity' && perplexityKey) {
          return await this.chatWithPerplexity(
            userMessage,
            perplexityKey,
            user,
          );
        }
        if (provider === 'openai' && openaiKey) {
          return await this.chatWithOpenAI(userMessage, openaiKey, user);
        }
        if (provider === 'gemini' && geminiKey) {
          return await this.chatWithGemini(userMessage, geminiKey, user);
        }
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        this.logger.warn(
          `Asistente: fallback tras error en ${provider}: ${lastError.message}`,
        );
      }
    }

    if (lastError && lastError instanceof ServiceUnavailableException) {
      throw lastError;
    }
    this.logger.warn(
      'Ningún proveedor de asistente configurado (PERPLEXITY_API_KEY, OPENAI_API_KEY o GEMINI_API_KEY).',
    );
    throw new ServiceUnavailableException(
      'El asistente no está configurado. Añade al menos una API key (Perplexity, OpenAI o Gemini).',
    );
  }

  /** Comprueba límites: por empresa (si aplica) o global. */
  private async assertWithinLimits(user?: Usuario): Promise<void> {
    const empresaId = user?.persona?.empresaId ?? user?.persona?.empresa?.id;

    if (empresaId != null) {
      const quota = await this.quotaRepo.getQuota(empresaId);
      if (quota !== null) {
        if (quota === 0) {
          throw new ServiceUnavailableException(
            'El asistente no está disponible para su empresa.' +
              QUOTA_CONTACT_MESSAGE,
          );
        }
        const used = await this.quotaRepo.getUsage(empresaId);
        if (used >= quota) {
          throw new ServiceUnavailableException(
            'Ha alcanzado el límite mensual de tokens de su empresa.' +
              QUOTA_CONTACT_MESSAGE,
          );
        }
        return;
      }
    }

    const monthlyLimit =
      this.configService.get<number>('ASSISTANT_MONTHLY_TOKEN_LIMIT') ?? 0;
    const dailyLimit =
      this.configService.get<number>('ASSISTANT_DAILY_REQUEST_LIMIT') ?? 0;
    try {
      this.usageStore.checkLimits(
        typeof monthlyLimit === 'string'
          ? parseInt(monthlyLimit, 10)
          : monthlyLimit,
        typeof dailyLimit === 'string' ? parseInt(dailyLimit, 10) : dailyLimit,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('ASSISTANT_LIMIT_REACHED')) {
        throw new ServiceUnavailableException(
          msg.replace('ASSISTANT_LIMIT_REACHED: ', ''),
        );
      }
      throw err;
    }
  }

  /**
   * Devuelve la cuota y uso para el usuario actual (para mostrar en el frontend).
   * Si tiene empresa con cuota asignada: tokens disponibles, usados, mensaje de contactar al admin.
   */
  async getQuotaForUser(user?: Usuario): Promise<{
    tokensAvailable: number | null;
    tokensUsed: number;
    quotaMonthly: number | null;
    message: string;
  }> {
    const empresaId = user?.persona?.empresaId ?? user?.persona?.empresa?.id;
    if (empresaId == null) {
      const data = this.usageStore.load();
      const monthlyLimit =
        this.configService.get<number>('ASSISTANT_MONTHLY_TOKEN_LIMIT') ?? 0;
      const limit =
        typeof monthlyLimit === 'string'
          ? parseInt(monthlyLimit, 10)
          : monthlyLimit;
      return {
        tokensAvailable:
          limit <= 0 ? null : Math.max(0, limit - data.totalTokens),
        tokensUsed: data.totalTokens,
        quotaMonthly: limit <= 0 ? null : limit,
        message:
          limit <= 0
            ? 'Sin límite global configurado.'
            : `Tienes ${Math.max(0, limit - data.totalTokens)} tokens disponibles de ${limit} este mes.${QUOTA_CONTACT_MESSAGE}`,
      };
    }

    const quota = await this.quotaRepo.getQuota(empresaId);
    if (quota === null) {
      return {
        tokensAvailable: null,
        tokensUsed: 0,
        quotaMonthly: null,
        message: 'Su empresa utiliza el límite general de la plataforma.',
      };
    }
    if (quota === 0) {
      return {
        tokensAvailable: 0,
        tokensUsed: 0,
        quotaMonthly: 0,
        message:
          'El asistente no está disponible para su empresa.' +
          QUOTA_CONTACT_MESSAGE,
      };
    }
    const used = await this.quotaRepo.getUsage(empresaId);
    const available = Math.max(0, quota - used);
    return {
      tokensAvailable: available,
      tokensUsed: used,
      quotaMonthly: quota,
      message: `Tienes ${available} tokens disponibles de ${quota} este mes.${QUOTA_CONTACT_MESSAGE}`,
    };
  }

  /** Listado de cuotas por empresa (solo ADMIN). */
  async listQuotasForAdmin(): Promise<
    {
      empresaId: number;
      razonSocial: string;
      tokenQuotaMonthly: number | null;
      tokensUsed: number;
    }[]
  > {
    return this.quotaRepo.listQuotasWithUsage();
  }

  /** Asignar cuota mensual a una empresa (solo ADMIN). */
  async setEmpresaQuota(
    empresaId: number,
    tokenQuotaMonthly: number,
  ): Promise<void> {
    const empresa = await this.empresaRepo.findOne({
      where: { id: empresaId, activo: true, eliminada: false },
    });
    if (!empresa) {
      throw new NotFoundException('Empresa no encontrada');
    }
    await this.quotaRepo.setQuota(empresaId, tokenQuotaMonthly);
  }

  /** Registra uso: por empresa o global. */
  private async recordUsage(tokens: number, user?: Usuario): Promise<void> {
    const empresaId = user?.persona?.empresaId ?? user?.persona?.empresa?.id;
    if (
      empresaId != null &&
      (await this.quotaRepo.getQuota(empresaId)) !== null
    ) {
      if (tokens > 0) {
        await this.quotaRepo.incrementUsage(empresaId, tokens);
      }
      return;
    }
    if (tokens > 0) {
      this.usageStore.recordRequest(tokens);
    }
  }

  /**
   * Perplexity: ideal para prueba de concepto. Con Perplexity Pro tienes ~5 USD/mes de crédito.
   * Obtén la API key en: https://perplexity.ai/settings → pestaña "</> API" → Generate API Key.
   */
  private async chatWithPerplexity(
    userMessage: string,
    apiKey: string,
    user?: Usuario,
  ): Promise<string> {
    const model =
      this.configService.get<string>('PERPLEXITY_MODEL') ||
      PERPLEXITY_DEFAULT_MODEL;
    const systemPrompt = `${PLATFORM_KNOWLEDGE}\n\nResponde de forma concisa. Incluye enlaces en formato [Texto](/ruta) cuando indiques una pantalla. Para pasos o instrucciones, usa una lista numerada con un paso por línea: 1. Primer paso. 2. Segundo paso. (cada número en una línea nueva).`;

    const body = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 600,
      temperature: 0.2,
    };

    try {
      const response = await fetch(PERPLEXITY_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errText = await response.text();
        this.logger.error(
          `Perplexity API error ${response.status}: ${errText}`,
        );
        throw new ServiceUnavailableException(
          'No se pudo obtener respuesta del asistente. Revisa tu crédito en Perplexity o intenta más tarde.',
        );
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: {
          total_tokens?: number;
          completion_tokens?: number;
          prompt_tokens?: number;
        };
      };
      const content = data.choices?.[0]?.message?.content?.trim();
      if (!content) {
        throw new ServiceUnavailableException(
          'El asistente no devolvió una respuesta válida.',
        );
      }
      const tokens = data.usage?.total_tokens ?? 0;
      await this.recordUsage(tokens, user);
      return content;
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }
      this.logger.error('Error calling Perplexity', error);
      throw new ServiceUnavailableException(
        'Error al conectar con el asistente. Intenta más tarde.',
      );
    }
  }

  private async chatWithOpenAI(
    userMessage: string,
    apiKey: string,
    user?: Usuario,
  ): Promise<string> {
    const model =
      this.configService.get<string>('OPENAI_MODEL') || OPENAI_DEFAULT_MODEL;
    const systemPrompt = `${PLATFORM_KNOWLEDGE}\n\nResponde de forma concisa. Incluye enlaces en formato [Texto](/ruta) cuando indiques una pantalla. Para pasos o instrucciones, usa una lista numerada con un paso por línea: 1. Primer paso. 2. Segundo paso. (cada número en una línea nueva).`;

    const body = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 600,
      temperature: 0.5,
    };

    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errText = await response.text();
        this.logger.error(`OpenAI API error ${response.status}: ${errText}`);
        throw new ServiceUnavailableException(
          'No se pudo obtener respuesta del asistente. Intenta de nuevo.',
        );
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: {
          total_tokens?: number;
          completion_tokens?: number;
          prompt_tokens?: number;
        };
      };
      const content = data.choices?.[0]?.message?.content?.trim();
      if (!content) {
        throw new ServiceUnavailableException(
          'El asistente no devolvió una respuesta válida.',
        );
      }
      const tokens = data.usage?.total_tokens ?? 0;
      await this.recordUsage(tokens, user);
      return content;
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }
      this.logger.error('Error calling OpenAI', error);
      throw new ServiceUnavailableException(
        'Error al conectar con el asistente. Intenta más tarde.',
      );
    }
  }

  /**
   * Google Gemini (tier gratuito con límites RPM/RPD).
   * API key en: https://aistudio.google.com/app/apikey
   */
  private async chatWithGemini(
    userMessage: string,
    apiKey: string,
    user?: Usuario,
  ): Promise<string> {
    const model =
      this.configService.get<string>('GEMINI_MODEL') || GEMINI_DEFAULT_MODEL;
    const systemPrompt = `${PLATFORM_KNOWLEDGE}\n\nResponde de forma concisa. Incluye enlaces en formato [Texto](/ruta) cuando indiques una pantalla. Para pasos o instrucciones, usa una lista numerada con un paso por línea.`;
    const url = `${GEMINI_API_BASE}/models/${model}:generateContent?key=${apiKey}`;
    const body = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: `${systemPrompt}\n\nPregunta del usuario: ${userMessage}` },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: 600,
        temperature: 0.2,
      },
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errText = await response.text();
        this.logger.error(`Gemini API error ${response.status}: ${errText}`);
        throw new ServiceUnavailableException(
          response.status === 429
            ? 'Límite de uso de Gemini alcanzado. Intenta más tarde.'
            : 'No se pudo obtener respuesta de Gemini.',
        );
      }

      const data = (await response.json()) as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
        }>;
        usageMetadata?: { totalTokenCount?: number };
      };
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (!text) {
        throw new ServiceUnavailableException(
          'El asistente no devolvió una respuesta válida.',
        );
      }
      const tokens = data.usageMetadata?.totalTokenCount ?? 0;
      await this.recordUsage(tokens, user);
      return text;
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }
      this.logger.error('Error calling Gemini', error);
      throw new ServiceUnavailableException(
        'Error al conectar con Gemini. Intenta más tarde.',
      );
    }
  }
}
