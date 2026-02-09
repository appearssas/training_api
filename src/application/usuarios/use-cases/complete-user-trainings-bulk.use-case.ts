import { Injectable, Logger } from '@nestjs/common';
import { CompleteUserTrainingsUseCase } from './complete-user-trainings.use-case';
import { CompleteUserTrainingsResponseDto } from '../dto/complete-user-trainings-response.dto';
import { CompleteUserTrainingsBulkResponseDto } from '../dto/complete-user-trainings-bulk-response.dto';

@Injectable()
export class CompleteUserTrainingsBulkUseCase {
  private readonly logger = new Logger(CompleteUserTrainingsBulkUseCase.name);

  constructor(
    private readonly completeUserTrainingsUseCase: CompleteUserTrainingsUseCase,
  ) {}

  async execute(
    userIds: number[],
  ): Promise<CompleteUserTrainingsBulkResponseDto> {
    const results: CompleteUserTrainingsResponseDto[] = [];

    for (const userId of userIds) {
      try {
        const result = await this.completeUserTrainingsUseCase.execute(userId);
        results.push(result);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Error completando capacitaciones para usuario ${userId}: ${msg}`,
        );
        results.push({
          userId,
          inscripcionesProcesadas: 0,
          message: `No se pudo procesar: ${msg}`,
          errors: [msg],
        });
      }
    }

    const totalProcessed = results.length;
    const totalSuccess = results.filter(
      r => r.inscripcionesProcesadas > 0,
    ).length;
    const totalErrors = results.filter(
      r => r.inscripcionesProcesadas === 0,
    ).length;

    return {
      results,
      totalProcessed,
      totalSuccess,
      totalErrors,
    };
  }
}
