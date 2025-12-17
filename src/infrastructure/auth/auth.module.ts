import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { LoginUseCase } from '@/application/auth/use-cases/login.use-case';
import { RefreshTokenUseCase } from '@/application/auth/use-cases/refresh-token.use-case';
import { RegisterUseCase } from '@/application/auth/use-cases/register.use-case';
import { AuthRepositoryAdapter } from './auth.repository.adapter';
import { Usuario } from '@/entities/usuario.entity';
import { Persona } from '@/entities/persona/persona.entity';
import { Rol } from '@/entities/roles/rol.entity';
import { PersonaRol } from '@/entities/roles/persona-rol.entity';
import { Alumno } from '@/entities/alumno.entity';
import { Instructor } from '@/entities/instructor.entity';
import { JwtStrategy } from '@/infrastructure/shared/auth/strategies/jwt.strategy';

@Module({
  controllers: [AuthController],
  providers: [
    LoginUseCase,
    RefreshTokenUseCase,
    RegisterUseCase,
    JwtStrategy,
    {
      provide: 'IAuthRepository',
      useClass: AuthRepositoryAdapter,
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
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ConfigModule,
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
