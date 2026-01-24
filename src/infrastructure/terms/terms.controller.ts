import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { DocumentoLegal } from '@/entities/documentos/documento-legal.entity';
import { AceptacionPolitica } from '@/entities/aceptaciones/aceptacion-politica.entity';
import { Usuario } from '@/entities/usuarios/usuario.entity';
import { GetUser } from '@/infrastructure/shared/auth/decorators/get-user.decorator';
import { Inject } from '@nestjs/common';
import { IAuthRepository } from '@/domain/auth/ports/auth.repository.port';
import { Public } from '@/infrastructure/shared/auth/decorators/public.decorator';
import { JwtAuthGuard } from '@/infrastructure/shared/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@/infrastructure/shared/guards/roles.guard';
import { AceptarTerminosUseCase } from '@/application/aceptaciones/use-cases/aceptar-terminos.use-case';
import { VerificarAceptacionUseCase } from '@/application/aceptaciones/use-cases/verificar-aceptacion.use-case';
import { ObtenerDocumentosActivosUseCase } from '@/application/aceptaciones/use-cases/obtener-documentos-activos.use-case';
import { AceptarTerminosDto } from '@/application/aceptaciones/dto/aceptar-terminos.dto';
import { AceptacionResponseDto } from '@/application/aceptaciones/dto/aceptacion-response.dto';
import { DocumentoLegalActivoResponseDto } from '@/application/aceptaciones/dto/documento-legal-response.dto';

@ApiTags('Términos y Condiciones')
@Controller('terms')
export class TermsController {
  constructor(
    @InjectRepository(DocumentoLegal)
    private readonly documentoLegalRepository: Repository<DocumentoLegal>,
    @InjectRepository(AceptacionPolitica)
    private readonly aceptacionRepository: Repository<AceptacionPolitica>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @Inject('IAuthRepository')
    private readonly authRepository: IAuthRepository,
    private readonly aceptarTerminosUseCase: AceptarTerminosUseCase,
    private readonly verificarAceptacionUseCase: VerificarAceptacionUseCase,
    private readonly obtenerDocumentosActivosUseCase: ObtenerDocumentosActivosUseCase,
  ) {}

  @Get('active-documents')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener documentos legales activos',
    description: `Obtiene la lista de todos los documentos legales activos que el usuario debe aceptar.

**Uso típico:**
1. El usuario intenta iniciar sesión
2. Si no ha aceptado los términos, se le muestran los documentos activos
3. El usuario debe aceptar todos los documentos para poder acceder`,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de documentos legales activos',
    type: [DocumentoLegalActivoResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  async getActiveDocuments(): Promise<DocumentoLegalActivoResponseDto[]> {
    return await this.obtenerDocumentosActivosUseCase.execute();
  }

  @Post('accept')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Aceptar términos y políticas',
    description: `Acepta los términos y condiciones, y políticas de privacidad del sistema.

**Requisitos:**
- El usuario debe estar autenticado
- Debe aceptar TODOS los documentos legales activos (no puede aceptar solo algunos)
- La aceptación queda registrada con fecha, IP y user agent para trazabilidad

**Flujo recomendado:**
1. Usuario intenta iniciar sesión y recibe error \`TERMS_NOT_ACCEPTED\`
2. Frontend obtiene documentos activos: \`GET /terms/active-documents\`
3. Frontend muestra los documentos al usuario
4. Usuario acepta y se envía este endpoint con todos los IDs
5. Usuario puede iniciar sesión exitosamente

**Endpoint:** \`POST /terms/accept\`

**Validaciones:**
- Verifica que todos los IDs correspondan a documentos activos
- Verifica que se incluyan TODOS los documentos activos (no puede faltar ninguno)
- Crea registros de aceptación para cada documento

**Nota:** Después de aceptar, el usuario podrá acceder normalmente al sistema mediante el endpoint de login.`,
  })
  @ApiBody({
    type: AceptarTerminosDto,
    examples: {
      ejemploCompleto: {
        summary: 'Ejemplo con todos los documentos activos',
        description: 'Debe incluir todos los IDs de documentos activos',
        value: {
          documentosIds: [1, 2],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description:
      'Términos aceptados exitosamente. Retorna un array con las aceptaciones creadas.',
    type: [AceptacionResponseDto],
    examples: {
      ejemploRespuesta: {
        summary: 'Respuesta exitosa',
        value: [
          {
            id: 1,
            documentoLegalId: 1,
            version: '1.0',
            fechaAceptacion: '2025-01-15T10:30:00.000Z',
          },
          {
            id: 2,
            documentoLegalId: 2,
            version: '1.0',
            fechaAceptacion: '2025-01-15T10:30:00.000Z',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Error de validación: debe aceptar todos los documentos legales activos o documentos inválidos',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example:
            'Debe aceptar todos los documentos legales activos. Faltan: 2',
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado - Token JWT inválido, expirado o ausente',
  })
  async acceptTerms(
    @Body() aceptarTerminosDto: AceptarTerminosDto,
    @GetUser() usuario: Usuario,
    @Request() req: ExpressRequest,
  ): Promise<AceptacionResponseDto[]> {
    const ipAddress = req.ip || req.socket?.remoteAddress || undefined;
    const userAgent = req.get('user-agent') || undefined;

    return await this.aceptarTerminosUseCase.execute(
      aceptarTerminosDto,
      usuario,
      ipAddress,
      userAgent,
    );
  }

  @Get('verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verificar si el usuario ha aceptado los términos',
    description: `Verifica si el usuario autenticado ha aceptado todos los documentos legales activos.

**Uso:** Este endpoint puede ser llamado por el frontend para verificar el estado de aceptación.

**Endpoint:** \`GET /terms/verify\``,
  })
  @ApiResponse({
    status: 200,
    description: 'El usuario ha aceptado todos los términos',
    schema: {
      type: 'object',
      properties: {
        aceptado: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Todos los términos han sido aceptados',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'El usuario no ha aceptado los términos y condiciones',
  })
  async verifyAcceptance(@GetUser() usuario: Usuario): Promise<{
    aceptado: boolean;
    message: string;
  }> {
    await this.verificarAceptacionUseCase.execute(usuario);
    return {
      aceptado: true,
      message: 'Todos los términos han sido aceptados',
    };
  }

  @Post('public/accept')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Aceptar términos y condiciones con credenciales (público)',
    description:
      'Endpoint público que permite aceptar términos usando username y password. Útil cuando el usuario no puede autenticarse porque no ha aceptado términos.',
  })
  @ApiResponse({
    status: 200,
    description: 'Términos aceptados exitosamente',
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas',
  })
  async acceptTermsWithCredentials(
    @Body()
    body: {
      username: string;
      password: string;
      documentosIds: number[];
    },
  ) {
    if (!body.username || !body.password) {
      throw new BadRequestException('Debe proporcionar username y password');
    }

    if (!body.documentosIds || body.documentosIds.length === 0) {
      throw new BadRequestException(
        'Debe proporcionar al menos un documento para aceptar',
      );
    }

    // Autenticar al usuario con las credenciales
    const user = await this.authRepository.findByUsername(body.username);

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar que el usuario esté activo y habilitado
    if (!user.activo) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    if (!user.habilitado) {
      throw new UnauthorizedException('Usuario no habilitado');
    }

    // Verificar la contraseña
    const isPasswordMatch = this.authRepository.comparePassword(
      body.password,
      user.passwordHash,
    );

    if (!isPasswordMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Obtener los documentos
    const documentos = await this.documentoLegalRepository.find({
      where: { id: In(body.documentosIds) },
    });

    if (documentos.length !== body.documentosIds.length) {
      throw new NotFoundException('Uno o más documentos no existen');
    }

    // Obtener el usuario completo
    const usuario = await this.usuarioRepository.findOne({
      where: { id: user.id },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Crear las aceptaciones usando el caso de uso
    const aceptarTerminosDto: AceptarTerminosDto = {
      documentosIds: body.documentosIds,
    };

    const ipAddress = undefined; // No disponible en este contexto
    const userAgent = undefined; // No disponible en este contexto

    return await this.aceptarTerminosUseCase.execute(
      aceptarTerminosDto,
      usuario,
      ipAddress,
      userAgent,
    );
  }

  @Post('accept-for-user/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Aceptar términos y políticas en nombre de otro usuario (Solo ADMIN)',
    description: `Permite a un administrador aceptar los términos y condiciones en nombre de otro usuario.

**Requisitos:**
- El usuario que realiza la acción debe ser ADMIN
- Debe aceptar TODOS los documentos legales activos
- La aceptación queda registrada con fecha, IP y user agent para trazabilidad

**Endpoint:** \`POST /terms/accept-for-user/:userId\``,
  })
  @ApiParam({ name: 'userId', type: Number, example: 1 })
  @ApiBody({
    type: AceptarTerminosDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Términos aceptados exitosamente en nombre del usuario',
    type: [AceptacionResponseDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Error de validación',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado - Se requiere rol de administrador (ADMIN)',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
  })
  async acceptTermsForUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() aceptarTerminosDto: AceptarTerminosDto,
    @Request() req: ExpressRequest,
  ): Promise<AceptacionResponseDto[]> {
    // Obtener el usuario objetivo
    const usuarioObjetivo = await this.usuarioRepository.findOne({
      where: { id: userId },
      relations: ['persona', 'rolPrincipal'],
    });

    if (!usuarioObjetivo) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    const ipAddress = req.ip || req.socket?.remoteAddress || undefined;
    const userAgent = req.get('user-agent') || undefined;

    return await this.aceptarTerminosUseCase.execute(
      aceptarTerminosDto,
      usuarioObjetivo,
      ipAddress,
      userAgent,
    );
  }
}
