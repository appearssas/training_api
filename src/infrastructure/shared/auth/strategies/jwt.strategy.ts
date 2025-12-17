import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Repository } from 'typeorm';
import { Usuario } from '@/entities/usuario.entity';
import { JwtPayload } from '@/infrastructure/shared/auth/interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(Usuario)
    private readonly userRepository: Repository<Usuario>,
    configService: ConfigService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');

    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<Usuario> {
    const { id } = payload;
    const user = await this.userRepository.findOne({
      where: {
        id,
        activo: true, // Solo usuarios activos
      },
      relations: ['rolPrincipal', 'persona'],
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado o inactivo');
    }

    // Verificar que la persona esté activa
    if (user.persona && !user.persona.activo) {
      throw new UnauthorizedException('Persona inactiva');
    }

    return user;
  }
}
