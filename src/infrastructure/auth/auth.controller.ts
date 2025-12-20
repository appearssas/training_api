import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { LoginUseCase } from '@/application/auth/use-cases/login.use-case';
import { RefreshTokenUseCase } from '@/application/auth/use-cases/refresh-token.use-case';
import { RegisterUseCase } from '@/application/auth/use-cases/register.use-case';
import { LoginDto } from '@/application/auth/dto/login.dto';
import { RegisterDto } from '@/application/auth/dto/register.dto';
import { UpdateProfileDto } from '@/application/auth/dto/update-profile.dto';
import { UpdateProfileUseCase } from '@/application/auth/use-cases/update-profile.use-case';
import { GetUser } from '@/infrastructure/shared/auth/decorators/get-user.decorator';
import { Usuario } from '@/entities/usuarios/usuario.entity';

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
  apellidos?: string;
  rol?: string;
  telefono?: string;
  direccion?: string;
  fechaNacimiento?: string;
  genero?: string;
  biografia?: string;
  fotoUrl?: string;
  numeroDocumento?: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly registerUseCase: RegisterUseCase,
    private readonly updateProfileUseCase: UpdateProfileUseCase,
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
        message: {
          type: 'string',
          example: 'Guardado exitoso; espere aprobacion por el administrador',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Datos de registro inválidos' })
  @ApiResponse({ status: 409, description: 'El usuario ya existe' })
  async register(@Body() registerDto: RegisterDto): Promise<{ message: string }> {
    const result = await this.registerUseCase.execute(registerDto);
    return result;
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
      rol: user.rolPrincipal?.codigo,
      // Persona data
      nombres: user.persona?.nombres || '',
      apellidos: user.persona?.apellidos,
      email: user.persona?.email,
      telefono: user.persona?.telefono,
      direccion: user.persona?.direccion,
      fechaNacimiento: user.persona?.fechaNacimiento
        ? new Date(user.persona.fechaNacimiento).toISOString().split('T')[0]
        : undefined,
      genero: user.persona?.genero,
      biografia: user.persona?.biografia,
      fotoUrl: user.persona?.fotoUrl,
      numeroDocumento: user.persona?.numeroDocumento,
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
  @Patch('profile')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Actualizar perfil del usuario autenticado' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({
    status: 200,
    description: 'Perfil actualizado exitosamente',
  })
  async updateProfile(
    @GetUser() user: Usuario,
    @Body() updateDto: UpdateProfileDto,
  ) {
    return await this.updateProfileUseCase.execute(user, updateDto);
  }

  @Post('profile/photo')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Subir o actualizar foto de perfil' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Archivo de imagen para el perfil',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './public/uploads/avatars',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
          return cb(new Error('Solo se permiten archivos de imagen!'), false);
        }
        cb(null, true);
      },
    }),
  )
  uploadProfilePhoto(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('No se subió ningún archivo');
    }
    return {
      message: 'Foto de perfil subida exitosamente',
      filePath: `/uploads/avatars/${file.filename}`,
    };
  }
}
