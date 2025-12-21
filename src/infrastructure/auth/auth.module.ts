import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { LoginUseCase } from '@/application/auth/use-cases/login.use-case';
import { RefreshTokenUseCase } from '@/application/auth/use-cases/refresh-token.use-case';
import { UpdateProfileUseCase } from '@/application/auth/use-cases/update-profile.use-case';
import { RegisterUseCase } from '@/application/auth/use-cases/register.use-case';
import { CreateAdminUseCase } from '@/application/auth/use-cases/create-admin.use-case';
import { ChangePasswordUseCase } from '@/application/auth/use-cases/change-password.use-case';
import { RequestPasswordResetUseCase } from '@/application/auth/use-cases/request-password-reset.use-case';
import { ResetPasswordUseCase } from '@/application/auth/use-cases/reset-password.use-case';
import { JwtStrategy } from '@/infrastructure/shared/auth/strategies/jwt.strategy';
import { AuthRepositoryAdapter } from '@/infrastructure/auth/auth.repository.adapter';
import { PasswordResetRepository } from '@/infrastructure/auth/password-reset.repository.adapter';
import { RolesGuard } from '@/infrastructure/shared/guards/roles.guard';
import { EmailModule } from '@/infrastructure/email/email.module';
import { Usuario } from '@/entities/usuarios/usuario.entity';
import { Persona } from '@/entities/persona/persona.entity';
import { Rol } from '@/entities/roles/rol.entity';
import { PersonaRol } from '@/entities/roles/persona-rol.entity';
import { Alumno } from '@/entities/alumnos/alumno.entity';
import { Instructor } from '@/entities/instructores/instructor.entity';
import { PasswordResetToken } from '@/entities/password-reset/password-reset-token.entity';

@Module({
  controllers: [AuthController],
  providers: [
    LoginUseCase,
    RefreshTokenUseCase,
    RegisterUseCase,
    CreateAdminUseCase,
    ChangePasswordUseCase,
    UpdateProfileUseCase,
    RequestPasswordResetUseCase,
    ResetPasswordUseCase,
    JwtStrategy,
    RolesGuard,
    {
      provide: 'IAuthRepository',
      useClass: AuthRepositoryAdapter,
    },
    {
      provide: 'IPasswordResetRepository',
      useClass: PasswordResetRepository,
    },
  ],
  exports: [JwtStrategy, PassportModule, JwtModule, TypeOrmModule],
  imports: [
    TypeOrmModule.forFeature([
      Usuario,
      Persona,
      Rol,
      PersonaRol,
      Alumno,
      Instructor,
      PasswordResetToken,
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ConfigModule,
    EmailModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'default-secret-key'),
        signOptions: {
          expiresIn: '24h',
        },
      }),
    }),
  ],
})
export class AuthModule {}
