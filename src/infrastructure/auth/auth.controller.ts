import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Param,
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
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { LoginUseCase } from '@/application/auth/use-cases/login.use-case';
import { RefreshTokenUseCase } from '@/application/auth/use-cases/refresh-token.use-case';
import { RegisterUseCase } from '@/application/auth/use-cases/register.use-case';
import { CreateAdminUseCase } from '@/application/auth/use-cases/create-admin.use-case';
import { ChangePasswordUseCase } from '@/application/auth/use-cases/change-password.use-case';
import {
  RequestPasswordResetUseCase,
  RequestPasswordResetResponse,
} from '@/application/auth/use-cases/request-password-reset.use-case';
import {
  ResetPasswordUseCase,
  ResetPasswordResponse,
} from '@/application/auth/use-cases/reset-password.use-case';
import { LoginDto } from '@/application/auth/dto/login.dto';
import { RegisterDto } from '@/application/auth/dto/register.dto';
import { CreateAdminDto } from '@/application/auth/dto/create-admin.dto';
import { ChangePasswordDto } from '@/application/auth/dto/change-password.dto';
import { UpdateProfileDto } from '@/application/auth/dto/update-profile.dto';
import { RequestPasswordResetDto } from '@/application/auth/dto/request-password-reset.dto';
import { ResetPasswordDto } from '@/application/auth/dto/reset-password.dto';
import { UpdateProfileUseCase } from '@/application/auth/use-cases/update-profile.use-case';
import { GetUser } from '@/infrastructure/shared/auth/decorators/get-user.decorator';
import { Usuario } from '@/entities/usuarios/usuario.entity';
import { RolesGuard, Roles } from '@/infrastructure/shared/guards/roles.guard';
import { EmailService } from '@/infrastructure/email/email.service';

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
  personaId?: number; // ID de la persona asociada al usuario
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
    private readonly updateProfileUseCase: UpdateProfileUseCase,
    private readonly requestPasswordResetUseCase: RequestPasswordResetUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly emailService: EmailService,
  ) {}


  @Post('register')
  @ApiOperation({
    summary: 'Registrar un nuevo usuario',
    description: `Registra un nuevo usuario en el sistema como persona natural o jurídica.
    
**Tipos de registro disponibles:**
- **ALUMNO**: Estudiante que puede inscribirse y tomar capacitaciones
- **INSTRUCTOR**: Instructor que puede crear y gestionar capacitaciones
- **OPERADOR**: Operador del sistema con permisos básicos

**Tipos de persona:**
- **NATURAL**: Persona física (por defecto)
- **JURIDICA**: Persona jurídica (requiere razón social)

**Nota:** El usuario queda en estado "No habilitado" hasta que un administrador lo apruebe.`,
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Usuario registrado exitosamente. El usuario queda pendiente de aprobación por el administrador.',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Registro exitoso. Espere aprobación del administrador.',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Datos de registro inválidos' })
  @ApiResponse({ status: 409, description: 'El usuario, email o documento ya existe' })
  async register(@Body() registerDto: RegisterDto): Promise<{ message: string }> {
    const result = await this.registerUseCase.execute(registerDto);
    return result;
  }

  @Post('login')
  @ApiOperation({
    summary: 'Iniciar sesión',
    description: `Inicia sesión en el sistema con credenciales de usuario.

**Autenticación flexible:**
- Puede autenticarse usando su **username** o su **email**
- El sistema detecta automáticamente el tipo de input (username o email)
- Ejemplo con username: \`"username": "juan.perez"\`
- Ejemplo con email: \`"username": "juan.perez@example.com"\`

**Validaciones realizadas:**
1. Verifica credenciales (username/email y password)
2. Verifica que el usuario esté activo
3. Verifica que el usuario esté habilitado (aprobado por administrador)
4. Verifica que el usuario haya aceptado los términos y condiciones

**Errores posibles:**
- \`401 Unauthorized\`: Credenciales inválidas, usuario inactivo o no habilitado
- \`401 TERMS_NOT_ACCEPTED\`: El usuario no ha aceptado los términos y condiciones (requiere aceptación)
- \`400 PASSWORD_CHANGE_REQUIRED\`: El usuario debe cambiar su contraseña temporal`,
  })
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
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas, usuario inactivo, no habilitado o términos no aceptados',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        error: {
          type: 'string',
          enum: ['Unauthorized', 'TERMS_NOT_ACCEPTED'],
          example: 'TERMS_NOT_ACCEPTED',
        },
        statusCode: { type: 'number', example: 401 },
        requiereAceptacionTerminos: {
          type: 'boolean',
          example: true,
          description: 'Indica que el usuario debe aceptar los términos antes de acceder',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Debe cambiar su contraseña temporal',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Debe cambiar su contraseña antes de continuar' },
        error: { type: 'string', example: 'PASSWORD_CHANGE_REQUIRED' },
        statusCode: { type: 'number', example: 400 },
        debeCambiarPassword: { type: 'boolean', example: true },
        username: { type: 'string', example: 'usuario.ejemplo' },
      },
    },
  })
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
      personaId: user.persona?.id, // Incluir el ID de la persona
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
  @ApiParam({
    name: 'username',
    type: String,
    description: 'Nombre de usuario del usuario que desea cambiar la contraseña',
    example: 'juan.perez',
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

  @Patch('profile')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Actualizar perfil del usuario autenticado',
    description:
      'Actualiza los datos del perfil del usuario autenticado. Solo se actualizan los campos proporcionados en el body.',
  })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({
    status: 200,
    description: 'Perfil actualizado exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Perfil actualizado exitosamente',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async updateProfile(
    @GetUser() user: Usuario,
    @Body() updateDto: UpdateProfileDto,
  ) {
    return await this.updateProfileUseCase.execute(user, updateDto);
  }

  @Post('profile/photo')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Subir o actualizar foto de perfil',
    description:
      'Sube o actualiza la foto de perfil del usuario autenticado. Acepta archivos de imagen (jpg, jpeg, png, gif). El archivo se guarda en /public/uploads/avatars/',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Archivo de imagen para el perfil',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo de imagen (jpg, jpeg, png, gif)',
        },
      },
      required: ['file'],
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
  @ApiResponse({
    status: 200,
    description: 'Foto de perfil subida exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Foto de perfil subida exitosamente',
        },
        filePath: {
          type: 'string',
          example: '/uploads/avatars/abc123def456.jpg',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'No se subió ningún archivo o formato inválido' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  uploadProfilePhoto(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new Error('No se subió ningún archivo');
    }
    return {
      message: 'Foto de perfil subida exitosamente',
      filePath: `/uploads/avatars/${file.filename}`,
    };
  }

  @Post('password-reset/request')
  @ApiOperation({ summary: 'Solicitar recuperación de contraseña' })
  @ApiBody({ type: RequestPasswordResetDto })
  @ApiResponse({
    status: 200,
    description: 'Solicitud procesada (siempre retorna éxito por seguridad)',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example:
            'Si el usuario existe, se ha enviado un correo con instrucciones para recuperar la contraseña',
        },
        emailSentTo: { type: 'string', example: 'j***@e***.com' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Error al enviar el correo',
  })
  async requestPasswordReset(
    @Body() dto: RequestPasswordResetDto,
  ): Promise<RequestPasswordResetResponse> {
    return await this.requestPasswordResetUseCase.execute(dto);
  }

  @Post('password-reset/reset')
  @ApiOperation({ summary: 'Resetear contraseña con token' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Contraseña restablecida exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Contraseña restablecida exitosamente',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Token inválido, expirado o contraseñas no coinciden',
  })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<ResetPasswordResponse> {
    return await this.resetPasswordUseCase.execute(dto);
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
