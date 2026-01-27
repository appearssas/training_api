import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { RolesController } from './roles.controller';
import { RolesRepositoryAdapter } from './roles.repository.adapter';
import { GetRolesUseCase } from '@/application/roles/use-cases/get-roles.use-case';
import { Rol } from '@/entities/roles/rol.entity';
import { IRolesRepository } from '@/domain/roles/ports/roles.repository.port';
import { RolesGuard } from '@/infrastructure/shared/guards/roles.guard';
import { AuthModule } from '@/infrastructure/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Rol]),
    PassportModule,
    AuthModule,
  ],
  controllers: [RolesController],
  providers: [
    GetRolesUseCase,
    RolesGuard,
    {
      provide: 'IRolesRepository',
      useClass: RolesRepositoryAdapter,
    },
  ],
  exports: ['IRolesRepository'],
})
export class RolesModule {}

