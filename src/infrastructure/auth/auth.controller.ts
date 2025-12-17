import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LoginUseCase } from '@/application/auth/use-cases/login.use-case';
import { RefreshTokenUseCase } from '@/application/auth/use-cases/refresh-token.use-case';
import { RegisterUseCase } from '@/application/auth/use-cases/register.use-case';
import { LoginDto } from '@/application/auth/dto/login.dto';
import { RegisterDto } from '@/application/auth/dto/register.dto';
import { GetUser } from '@/infrastructure/shared/auth/decorators/get-user.decorator';
import { Usuario } from '@/entities/usuario.entity';

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: string;
}

interface UserProfileResponse {
  id: number;
  username: string;
  email?: string;
  nombres: string;
  apellidos: string;
  rol?: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly registerUseCase: RegisterUseCase,
  ) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<TokenResponse> {
    const result = await this.registerUseCase.execute(registerDto);
    return result as TokenResponse;
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<TokenResponse> {
    const result = await this.loginUseCase.execute(loginDto);
    return result as TokenResponse;
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  getProfile(@GetUser() user: Usuario): UserProfileResponse {
    return {
      id: user.id,
      username: user.username,
      email: user.persona?.email || undefined,
      nombres: user.persona?.nombres || '',
      apellidos: user.persona?.apellidos || '',
      rol: user.rolPrincipal?.codigo || undefined,
    };
  }

  @Get('refresh')
  @UseGuards(AuthGuard('jwt'))
  async refreshToken(@GetUser() user: Usuario): Promise<TokenResponse> {
    const result = await this.refreshTokenUseCase.execute(user);
    return result as TokenResponse;
  }
}
