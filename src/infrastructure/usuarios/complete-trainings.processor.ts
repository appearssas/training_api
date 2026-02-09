import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { CompleteUserTrainingsBulkUseCase } from '@/application/usuarios/use-cases/complete-user-trainings-bulk.use-case';
import type { CompleteUserTrainingsBulkResponseDto } from '@/application/usuarios/dto/complete-user-trainings-bulk-response.dto';

export const COMPLETE_TRAININGS_QUEUE = 'complete-trainings';

export interface CompleteTrainingsJobData {
  userIds: number[];
}

@Processor(COMPLETE_TRAININGS_QUEUE)
export class CompleteTrainingsProcessor extends WorkerHost {
  private readonly logger = new Logger(CompleteTrainingsProcessor.name);

  constructor(
    private readonly completeUserTrainingsBulkUseCase: CompleteUserTrainingsBulkUseCase,
  ) {
    super();
  }

  async process(
    job: Job<CompleteTrainingsJobData, CompleteUserTrainingsBulkResponseDto>,
  ): Promise<CompleteUserTrainingsBulkResponseDto> {
    const { userIds } = job.data;
    this.logger.log(
      `Procesando lote de ${userIds.length} usuario(s) (job ${job.id})`,
    );
    const result = await this.completeUserTrainingsBulkUseCase.execute(userIds);
    this.logger.log(
      `Lote completado: ${result.totalSuccess} éxito(s), ${result.totalErrors} error(es) (job ${job.id})`,
    );
    return result;
  }
}
