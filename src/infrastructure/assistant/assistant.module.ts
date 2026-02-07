import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';
import { AssistantUsageStore } from './assistant-usage.store';
import { AssistantQuotaRepository } from './assistant-quota.repository';
import { AssistantEmpresaQuota } from '@/entities/assistant/assistant-empresa-quota.entity';
import { AssistantEmpresaUsage } from '@/entities/assistant/assistant-empresa-usage.entity';
import { Empresa } from '@/entities/empresas/empresa.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AssistantEmpresaQuota,
      AssistantEmpresaUsage,
      Empresa,
    ]),
  ],
  controllers: [AssistantController],
  providers: [AssistantService, AssistantUsageStore, AssistantQuotaRepository],
  exports: [AssistantService],
})
export class AssistantModule {}
