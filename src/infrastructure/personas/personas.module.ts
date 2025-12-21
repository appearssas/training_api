import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { PersonasController } from './personas.controller';
import { PersonasRepositoryAdapter } from './personas.repository.adapter';
import { CreateConductorExternoUseCase } from '@/application/personas/use-cases/create-conductor-externo.use-case';
import { Persona } from '@/entities/persona/persona.entity';
import { Alumno } from '@/entities/alumnos/alumno.entity';
import { Usuario } from '@/entities/usuarios/usuario.entity';
import { Rol } from '@/entities/roles/rol.entity';
import { IPersonasRepository } from '@/domain/personas/ports/personas.repository.port';
import { RolesGuard } from '@/infrastructure/shared/guards/roles.guard';
import { AuthModule } from '@/infrastructure/auth/auth.module';
import { EmailService } from '@/infrastructure/shared/services/email.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Persona, Alumno, Usuario, Rol]),
    PassportModule,
    AuthModule, // Importar AuthModule para tener acceso a JwtStrategy y PassportModule
  ],
  controllers: [PersonasController],
  providers: [
    CreateConductorExternoUseCase,
    RolesGuard, // Registrar el guard como provider para que pueda ser inyectado
    EmailService, // Servicio de email
    {
      provide: 'IPersonasRepository',
      useClass: PersonasRepositoryAdapter,
    },
  ],
  exports: ['IPersonasRepository'],
})
export class PersonasModule {}

