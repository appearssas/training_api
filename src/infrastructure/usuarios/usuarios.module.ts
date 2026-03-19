import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { QueueEvents } from 'bullmq';
import { Usuario } from '@/entities/usuarios/usuario.entity';
import { Rol } from '@/entities/roles/rol.entity';
import { Empresa } from '@/entities/empresas/empresa.entity';
import { UsuariosController } from './usuarios.controller';
import { UsuariosRepositoryAdapter } from './usuarios.repository.adapter';
import {
  CompleteTrainingsProcessor,
  COMPLETE_TRAININGS_QUEUE,
} from './complete-trainings.processor';
import { GetUsersUseCase } from '@/application/usuarios/use-cases/get-users.use-case';
import { GetUserByIdUseCase } from '@/application/usuarios/use-cases/get-user-by-id.use-case';
import { UpdateUserUseCase } from '@/application/usuarios/use-cases/update-user.use-case';
import { DeleteUserUseCase } from '@/application/usuarios/use-cases/delete-user.use-case';
import { CompleteUserTrainingsUseCase } from '@/application/usuarios/use-cases/complete-user-trainings.use-case';
import { CompleteUserTrainingsBulkUseCase } from '@/application/usuarios/use-cases/complete-user-trainings-bulk.use-case';
import { ExportUsersUseCase } from '@/application/usuarios/use-cases/export-users.use-case';
import { IntentosModule } from '../intentos/intentos.module';
import { InscripcionesModule } from '../inscripciones/inscripciones.module';
import { CapacitacionesModule } from '../capacitaciones/capacitaciones.module';
import { ProgresoModule } from '../progreso/progreso.module';

const redisEnabled = process.env.REDIS_ENABLED === 'true';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, Rol, Empresa]),
    ...(redisEnabled
      ? [BullModule.registerQueue({ name: COMPLETE_TRAININGS_QUEUE })]
      : []),
    IntentosModule,
    InscripcionesModule,
    CapacitacionesModule,
    ProgresoModule,
  ],
  controllers: [UsuariosController],
  providers: [
    ...(redisEnabled ? [CompleteTrainingsProcessor] : []),
    ...(redisEnabled
      ? [
          {
            provide: 'COMPLETE_TRAININGS_QUEUE_EVENTS',
            useFactory: (config: ConfigService) =>
              new QueueEvents(COMPLETE_TRAININGS_QUEUE, {
                connection: {
                  host: config.get<string>('REDIS_HOST', 'localhost'),
                  port: config.get<number>('REDIS_PORT', 6379),
                  ...(config.get<string>('REDIS_PASSWORD') && {
                    password: config.get<string>('REDIS_PASSWORD'),
                  }),
                },
              }),
            inject: [ConfigService],
          },
        ]
      : []),
    // Repository Adapter
    {
      provide: 'IUsuariosRepository',
      useClass: UsuariosRepositoryAdapter,
    },
    // Use Cases
    GetUsersUseCase,
    GetUserByIdUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
    CompleteUserTrainingsUseCase,
    CompleteUserTrainingsBulkUseCase,
    ExportUsersUseCase,
  ],
  exports: ['IUsuariosRepository'],
})
export class UsuariosModule {}
