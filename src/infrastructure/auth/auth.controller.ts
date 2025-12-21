import { Controller, Post, Body, Get, UseGuards, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { LoginUseCase } from '@/application/auth/use-cases/login.use-case';
import { RefreshTokenUseCase } from '@/application/auth/use-cases/refresh-token.use-case';
import { RegisterUseCase } from '@/application/auth/use-cases/register.use-case';
import { CreateAdminUseCase } from '@/application/auth/use-cases/create-admin.use-case';
import { ChangePasswordUseCase } from '@/application/auth/use-cases/change-password.use-case';
import { LoginDto } from '@/application/auth/dto/login.dto';
import { RegisterDto } from '@/application/auth/dto/register.dto';
import { CreateAdminDto } from '@/application/auth/dto/create-admin.dto';
import { ChangePasswordDto } from '@/application/auth/dto/change-password.dto';
import { GetUser } from '@/infrastructure/shared/auth/decorators/get-user.decorator';
import { Usuario } from '@/entities/usuarios/usuario.entity';
import { RolesGuard, Roles } from '@/infrastructure/shared/guards/roles.guard';
import { EmailService } from '@/infrastructure/shared/services/email.service';

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface UserProfileResponse {
  id: number;
  username: string;
  email?: string;
  nombres: string;
  apellidos: string;
  rol?: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly registerUseCase: RegisterUseCase,
    private readonly createAdminUseCase: CreateAdminUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly emailService: EmailService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar un nuevo usuario' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Usuario registrado exitosamente',
    schema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        token_type: { type: 'string', example: 'Bearer' },
        expires_in: { type: 'number', example: 3600 },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Datos de registro inválidos' })
  @ApiResponse({ status: 409, description: 'El usuario ya existe' })
  async register(@Body() registerDto: RegisterDto): Promise<TokenResponse> {
    const result = await this.registerUseCase.execute(registerDto);
    return result as TokenResponse;
  }

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso',
    schema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        token_type: { type: 'string', example: 'Bearer' },
        expires_in: { type: 'number', example: 3600 },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(@Body() loginDto: LoginDto): Promise<TokenResponse> {
    const result = await this.loginUseCase.execute(loginDto);
    return result as TokenResponse;
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Perfil del usuario',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        username: { type: 'string', example: 'juan.perez' },
        email: { type: 'string', example: 'juan.perez@example.com' },
        nombres: { type: 'string', example: 'Juan' },
        apellidos: { type: 'string', example: 'Pérez' },
        rol: { type: 'string', example: 'ALUMNO' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Refrescar token de acceso' })
  @ApiResponse({
    status: 200,
    description: 'Token refrescado exitosamente',
    schema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        token_type: { type: 'string', example: 'Bearer' },
        expires_in: { type: 'number', example: 3600 },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  refreshToken(@GetUser() user: Usuario): TokenResponse {
    const result = this.refreshTokenUseCase.execute(user);
    return result as TokenResponse;
  }

  @Post('admin')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Crear nuevo administrador',
    description:
      'Crea un nuevo usuario administrador. Solo disponible para administradores existentes.',
  })
  @ApiBody({ type: CreateAdminDto })
  @ApiResponse({
    status: 201,
    description: 'Administrador creado exitosamente',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        username: { type: 'string', example: 'admin.juan' },
        email: { type: 'string', example: 'admin@example.com' },
        nombres: { type: 'string', example: 'Juan' },
        apellidos: { type: 'string', example: 'Pérez' },
        rol: { type: 'string', example: 'ADMIN' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado - Se requiere rol de administrador',
  })
  @ApiResponse({
    status: 409,
    description: 'El usuario, email o documento ya existe',
  })
  async createAdmin(@Body() createAdminDto: CreateAdminDto) {
    return await this.createAdminUseCase.execute(createAdminDto);
  }

  @Post('change-password/:username')
  @ApiOperation({
    summary: 'Cambiar contraseña temporal (por username)',
    description:
      'Permite cambiar la contraseña temporal. Usar este endpoint cuando se recibe el error PASSWORD_CHANGE_REQUIRED en el login.',
  })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Contraseña cambiada exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example:
            'Contraseña cambiada exitosamente. Ya puede iniciar sesión con su nueva contraseña.',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o contraseña no cumple requisitos',
  })
  @ApiResponse({ status: 401, description: 'Contraseña temporal incorrecta' })
  async changePasswordByUsername(
    @Body() changePasswordDto: ChangePasswordDto,
    @Param('username') username: string,
  ) {
    return await this.changePasswordUseCase.execute(
      username,
      changePasswordDto,
    );
  }

  @Post('test-email')
  @ApiOperation({
    summary: '[TEMPORAL] Probar envío de correo',
    description:
      'Endpoint temporal para probar el envío de correos con credenciales. Solo para desarrollo/testing.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          example: 'test@example.com',
          description: 'Email del destinatario',
        },
        nombre: {
          type: 'string',
          example: 'Juan Pérez',
          description: 'Nombre del usuario',
        },
        username: {
          type: 'string',
          example: 'juan.perez',
          description: 'Username para login',
        },
        passwordTemporal: {
          type: 'string',
          example: 'TEMP_A3b7K9m2P5q',
          description: 'Contraseña temporal',
        },
      },
      required: ['email', 'nombre', 'username', 'passwordTemporal'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Correo de prueba enviado',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Correo de prueba enviado exitosamente',
        },
        email: {
          type: 'string',
          example: 'test@example.com',
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Error al enviar el correo',
  })
  async testEmail(
    @Body()
    body: {
      email: string;
      nombre: string;
      username: string;
      passwordTemporal: string;
    },
  ) {
    try {
      await this.emailService.enviarCredencialesTemporales(
        body.email,
        body.nombre,
        body.username,
        body.passwordTemporal,
      );
      return {
        success: true,
        message: 'Correo de prueba enviado exitosamente',
        email: body.email,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error al enviar correo de prueba',
        error: error.message,
        email: body.email,
        detalles: {
          host: process.env.EMAIL_HOST || 'NO CONFIGURADO',
          port: process.env.EMAIL_PORT || 'NO CONFIGURADO',
          user: process.env.EMAIL_USER || 'NO CONFIGURADO',
          secure: process.env.EMAIL_SECURE || 'NO CONFIGURADO',
        },
      };
    }
  }
}
