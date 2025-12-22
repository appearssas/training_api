import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { PersonasController } from './personas.controller';
import { PersonasRepositoryAdapter } from './personas.repository.adapter';
import { CreateConductorExternoUseCase } from '@/application/personas/use-cases/create-conductor-externo.use-case';
import { CargaMasivaConductoresUseCase } from '@/application/personas/use-cases/carga-masiva-conductores.use-case';
import { Persona } from '@/entities/persona/persona.entity';
import { Alumno } from '@/entities/alumnos/alumno.entity';
import { Usuario } from '@/entities/usuarios/usuario.entity';
import { Rol } from '@/entities/roles/rol.entity';
import { IPersonasRepository } from '@/domain/personas/ports/personas.repository.port';
import { RolesGuard } from '@/infrastructure/shared/guards/roles.guard';
import { AuthModule } from '@/infrastructure/auth/auth.module';
import { EmailModule } from '@/infrastructure/email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Persona, Alumno, Usuario, Rol]),
    PassportModule,
    AuthModule, // Importar AuthModule para tener acceso a JwtStrategy y PassportModule
    EmailModule, // Importar EmailModule para tener acceso a EmailService
  ],
  controllers: [PersonasController],
  providers: [
    CreateConductorExternoUseCase,
    CargaMasivaConductoresUseCase,
    RolesGuard, // Registrar el guard como provider para que pueda ser inyectado
    {
      provide: 'IPersonasRepository',
      useClass: PersonasRepositoryAdapter,
    },
  ],
  exports: ['IPersonasRepository'],
})
export class PersonasModule {}

