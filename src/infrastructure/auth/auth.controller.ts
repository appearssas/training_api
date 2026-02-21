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
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
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
import { Inject } from '@nestjs/common';
import { IAuthRepository } from '@/domain/auth/ports/auth.repository.port';
import { Public } from '@/infrastructure/shared/auth/decorators/public.decorator';
import { LoginUseCase } from '@/application/auth/use-cases/login.use-case';
import { RefreshTokenUseCase } from '@/application/auth/use-cases/refresh-token.use-case';
import { RegisterUseCase } from '@/application/auth/use-cases/register.use-case';
import { CreateAdminUseCase } from '@/application/auth/use-cases/create-admin.use-case';
import { ChangePasswordUseCase } from '@/application/auth/use-cases/change-password.use-case';
import { AdminChangeUserPasswordUseCase } from '@/application/auth/use-cases/admin-change-user-password.use-case';
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
import { AdminChangeUserPasswordDto } from '@/application/auth/dto/admin-change-user-password.dto';
import { UpdateProfileDto } from '@/application/auth/dto/update-profile.dto';
import { RequestPasswordResetDto } from '@/application/auth/dto/request-password-reset.dto';
import { ResetPasswordDto } from '@/application/auth/dto/reset-password.dto';
import { UpdateProfileUseCase } from '@/application/auth/use-cases/update-profile.use-case';
import { GetUser } from '@/infrastructure/shared/auth/decorators/get-user.decorator';
import { Usuario } from '@/entities/usuarios/usuario.entity';
import { RolesGuard, Roles } from '@/infrastructure/shared/guards/roles.guard';
import { EmailService } from '@/infrastructure/email/email.service';
import { StorageService } from '@/infrastructure/shared/services/storage.service';
import { ImageCompressionService } from '@/infrastructure/shared/services/image-compression.service';

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
  empresaId?: number; // ID de la empresa asociada al usuario
  empresa?: {
    id: number;
    razonSocial: string;
    numeroDocumento: string;
  };
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
    private readonly adminChangeUserPasswordUseCase: AdminChangeUserPasswordUseCase,
    private readonly updateProfileUseCase: UpdateProfileUseCase,
    private readonly requestPasswordResetUseCase: RequestPasswordResetUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly emailService: EmailService,
    private readonly storageService: StorageService,
    private readonly imageCompressionService: ImageCompressionService,
    @Inject('IAuthRepository')
    private readonly authRepository: IAuthRepository,
  ) {}

  @Post('public/register')
  @Public()
  @ApiOperation({
    summary: 'Registro público de usuario',
    description: `Endpoint público para que nuevos usuarios se registren en el sistema.

**Tipos de registro disponibles:**
- **ALUMNO**: Estudiante que puede inscribirse y tomar capacitaciones (asignado automáticamente para personas naturales)
- **CLIENTE**: Cliente institucional (asignado automáticamente para personas jurídicas con NIT)

**Tipos de persona:**
- **NATURAL**: Persona física (por defecto)
- **JURIDICA**: Persona jurídica (requiere razón social y tipo de documento NIT)

**Nota:**
- El usuario queda en estado "No habilitado" hasta que un administrador lo apruebe.
- Los términos y condiciones se aceptan automáticamente si se envían en el payload.`,
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description:
      'Usuario registrado exitosamente. El usuario queda pendiente de aprobación por el administrador.',
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
  @ApiResponse({
    status: 409,
    description: 'El usuario, email o documento ya existe',
  })
  async publicRegister(
    @Body() registerDto: RegisterDto,
  ): Promise<{ message: string }> {
    // Para registro público, no hay usuario actual, así que pasamos undefined
    const result = await this.registerUseCase.execute(registerDto, undefined);
    return result;
  }

  @Post('register')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'CLIENTE')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Registrar un nuevo usuario (requiere autenticación)',
    description: `Registra un nuevo usuario en el sistema como persona natural o jurídica. Requiere autenticación con rol ADMIN o CLIENTE.

**Tipos de registro disponibles:**
- **ALUMNO**: Estudiante que puede inscribirse y tomar capacitaciones
- **INSTRUCTOR**: Instructor que puede crear y gestionar capacitaciones
- **OPERADOR**: Operador del sistema con permisos básicos
- **CLIENTE**: Cliente institucional

**Tipos de persona:**
- **NATURAL**: Persona física (por defecto)
- **JURIDICA**: Persona jurídica (requiere razón social)

**Asociación a empresa:**
- Si el usuario que crea es **CLIENTE**, el nuevo usuario se asociará automáticamente a su empresa
- Si el usuario que crea es **ADMIN**, puede especificar la empresa mediante \`empresaId\` o dejar que se asocie automáticamente si el tipo de documento es NIT

**Nota:** El usuario queda en estado "No habilitado" hasta que un administrador lo apruebe.`,
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description:
      'Usuario registrado exitosamente. El usuario queda pendiente de aprobación por el administrador.',
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
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado - Se requiere rol ADMIN o CLIENTE',
  })
  @ApiResponse({
    status: 409,
    description: 'El usuario, email o documento ya existe',
  })
  async register(
    @Body() registerDto: RegisterDto,
    @GetUser() currentUser: Usuario,
  ): Promise<{ message: string }> {
    const result = await this.registerUseCase.execute(registerDto, currentUser);
    return result;
  }

  @Post('login')
  @Public()
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
    description:
      'Credenciales inválidas, usuario inactivo, no habilitado o términos no aceptados',
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
          description:
            'Indica que el usuario debe aceptar los términos antes de acceder',
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
        message: {
          type: 'string',
          example: 'Debe cambiar su contraseña antes de continuar',
        },
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
  @ApiOperation({
    summary: 'Obtener perfil del usuario autenticado',
    description:
      'Obtiene el perfil completo del usuario autenticado, incluyendo datos personales e información de la empresa asociada (si aplica).',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil del usuario',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1, description: 'ID del usuario' },
        username: {
          type: 'string',
          example: 'juan.perez',
          description: 'Nombre de usuario',
        },
        rol: {
          type: 'string',
          example: 'ALUMNO',
          description: 'Rol del usuario (ADMIN, ALUMNO, INSTRUCTOR, CLIENTE)',
        },
        nombres: {
          type: 'string',
          example: 'Juan',
          description: 'Nombres de la persona',
        },
        apellidos: {
          type: 'string',
          example: 'Pérez',
          description: 'Apellidos de la persona',
        },
        email: {
          type: 'string',
          example: 'juan.perez@example.com',
          description: 'Correo electrónico',
        },
        telefono: {
          type: 'string',
          example: '+573001234567',
          description: 'Número de teléfono',
        },
        direccion: {
          type: 'string',
          example: 'Calle 123 #45-67',
          description: 'Dirección de residencia',
        },
        fechaNacimiento: {
          type: 'string',
          example: '1990-01-15',
          description: 'Fecha de nacimiento (formato ISO)',
        },
        genero: {
          type: 'string',
          example: 'M',
          enum: ['M', 'F', 'O'],
          description: 'Género (M: Masculino, F: Femenino, O: Otro)',
        },
        biografia: {
          type: 'string',
          example: 'Biografía del usuario',
          description: 'Biografía o descripción personal',
        },
        fotoUrl: {
          type: 'string',
          example: '/uploads/avatars/abc123.jpg',
          description: 'URL de la foto de perfil',
        },
        numeroDocumento: {
          type: 'string',
          example: '1234567890',
          description: 'Número de documento de identidad',
        },
        personaId: {
          type: 'number',
          example: 1,
          description: 'ID de la persona asociada al usuario',
        },
        empresaId: {
          type: 'number',
          example: 1,
          description: 'ID de la empresa asociada al usuario (si aplica)',
        },
        empresa: {
          type: 'object',
          description: 'Información de la empresa asociada (si aplica)',
          properties: {
            id: {
              type: 'number',
              example: 1,
              description: 'ID de la empresa',
            },
            razonSocial: {
              type: 'string',
              example: 'Empresa SAS',
              description: 'Razón social de la empresa',
            },
            numeroDocumento: {
              type: 'string',
              example: '900123456-1',
              description: 'Número de documento de la empresa (NIT)',
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  getProfile(@GetUser() user: Usuario): UserProfileResponse {
    // Logs de depuración
    console.log('🔍 [getProfile] Usuario recibido:', {
      id: user.id,
      username: user.username,
      personaId: user.persona?.id,
      empresaId: user.persona?.empresaId,
      tieneEmpresa: !!user.persona?.empresa,
      empresa: user.persona?.empresa
        ? {
            id: user.persona.empresa.id,
            razonSocial: user.persona.empresa.razonSocial,
            numeroDocumento: user.persona.empresa.numeroDocumento,
          }
        : null,
    });

    const response: UserProfileResponse = {
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
      empresaId: user.persona?.empresaId, // Incluir el ID de la empresa
      empresa: user.persona?.empresa
        ? {
            id: user.persona.empresa.id,
            razonSocial: user.persona.empresa.razonSocial,
            numeroDocumento: user.persona.empresa.numeroDocumento,
          }
        : undefined, // Incluir información de la empresa si existe
    };

    console.log(
      '📤 [getProfile] Respuesta enviada:',
      JSON.stringify(response, null, 2),
    );

    return response;
  }

  @Get('refresh')
  @Public()
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

  @Patch('admin/change-user-password/:userId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Cambiar contraseña de un usuario (solo administrador)',
    description:
      'Permite al administrador cambiar la contraseña de cualquier usuario. Requiere ingresar la contraseña del administrador para verificar identidad.',
  })
  @ApiParam({
    name: 'userId',
    type: Number,
    description: 'ID del usuario al que se le cambiará la contraseña',
  })
  @ApiBody({ type: AdminChangeUserPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Contraseña del usuario actualizada correctamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Nueva contraseña inválida o igual a la actual',
  })
  @ApiResponse({
    status: 401,
    description: 'Contraseña de administrador incorrecta',
  })
  @ApiResponse({ status: 403, description: 'Se requiere rol ADMIN' })
  @ApiResponse({
    status: 404,
    description: 'Usuario a modificar no encontrado',
  })
  async adminChangeUserPassword(
    @Param('userId') userId: string,
    @Body() dto: AdminChangeUserPasswordDto,
    @GetUser() adminUser: Usuario,
  ) {
    return await this.adminChangeUserPasswordUseCase.execute(
      adminUser,
      Number(userId),
      dto,
    );
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
    description:
      'Nombre de usuario del usuario que desea cambiar la contraseña',
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

  @Post('register/photo')
  @Public()
  @ApiOperation({
    summary: 'Subir foto de perfil durante el registro (público)',
    description:
      'Sube una foto de perfil durante el proceso de registro público. La imagen se comprime automáticamente a máximo 500KB sin perder calidad significativa. Retorna la URL de la foto para incluirla en el registro.',
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
          description: 'Archivo de imagen (jpg, jpeg, png, gif, webp)',
        },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(), // Usar memoryStorage para tener el buffer disponible para comprimir
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          return cb(new Error('Solo se permiten archivos de imagen!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB máximo antes de comprimir
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
        fotoUrl: {
          type: 'string',
          example: '/storage/avatars/abc123def456.jpg',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'No se subió ningún archivo o formato inválido',
  })
  async uploadRegisterPhoto(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se subió ningún archivo');
    }

    // Comprimir la imagen a máximo 500KB
    const compressed = await this.imageCompressionService.compressMulterFile(
      file,
      500,
    );

    // Guardar usando StorageService (maneja S3 o local automáticamente)
    const fotoUrl = await this.storageService.saveBuffer(
      compressed.buffer,
      compressed.filename,
      'avatars',
      compressed.mimetype,
    );

    return {
      message: 'Foto de perfil subida exitosamente',
      fotoUrl,
    };
  }

  @Post('profile/validate-password')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Validar contraseña actual',
    description:
      'Valida si la contraseña proporcionada coincide con la contraseña actual del usuario autenticado. Útil para habilitar campos de cambio de contraseña.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        password: {
          type: 'string',
          description: 'Contraseña a validar',
        },
      },
      required: ['password'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Contraseña válida',
    schema: {
      type: 'object',
      properties: {
        valid: {
          type: 'boolean',
          example: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Contraseña inválida o no autorizado',
  })
  async validatePassword(
    @GetUser() user: Usuario,
    @Body() body: { password: string },
  ): Promise<{ valid: boolean }> {
    const fullUser = await this.authRepository.findByUsername(user.username);
    if (!fullUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const isValid = this.authRepository.comparePassword(
      body.password,
      fullUser.passwordHash,
    );
    return { valid: isValid };
  }

  @Post('profile/photo')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Subir o actualizar foto de perfil',
    description:
      'Sube o actualiza la foto de perfil del usuario autenticado. Acepta archivos de imagen (jpg, jpeg, png, gif, webp). La imagen se comprime automáticamente a máximo 500KB sin perder calidad significativa.',
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
          description: 'Archivo de imagen (jpg, jpeg, png, gif, webp)',
        },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(), // Usar memoryStorage para tener el buffer disponible para comprimir
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          return cb(new Error('Solo se permiten archivos de imagen!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB máximo antes de comprimir
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
        fotoUrl: {
          type: 'string',
          example: '/storage/avatars/abc123def456.jpg',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'No se subió ningún archivo o formato inválido',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async uploadProfilePhoto(
    @UploadedFile() file?: Express.Multer.File,
    @GetUser() user?: Usuario,
  ) {
    if (!file) {
      throw new BadRequestException('No se subió ningún archivo');
    }

    // Comprimir la imagen a máximo 500KB
    const compressed = await this.imageCompressionService.compressMulterFile(
      file,
      500,
    );

    // Guardar usando StorageService (maneja S3 o local automáticamente)
    const fotoUrl = await this.storageService.saveBuffer(
      compressed.buffer,
      compressed.filename,
      'avatars',
      compressed.mimetype,
    );

    // Actualizar el perfil del usuario con la nueva foto
    if (user) {
      await this.updateProfileUseCase.execute(user, { fotoUrl });
    }

    return {
      message: 'Foto de perfil subida exitosamente',
      fotoUrl,
    };
  }

  @Post('password-reset/request')
  @Public()
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
  @Public()
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
      const message = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: 'Error al enviar correo de prueba',
        error: message,
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
