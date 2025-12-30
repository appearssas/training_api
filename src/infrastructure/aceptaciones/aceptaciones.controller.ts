import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AceptarTerminosUseCase } from '@/application/aceptaciones/use-cases/aceptar-terminos.use-case';
import { VerificarAceptacionUseCase } from '@/application/aceptaciones/use-cases/verificar-aceptacion.use-case';
import { ObtenerDocumentosActivosUseCase } from '@/application/aceptaciones/use-cases/obtener-documentos-activos.use-case';
import { AceptarTerminosDto } from '@/application/aceptaciones/dto/aceptar-terminos.dto';
import { AceptacionResponseDto } from '@/application/aceptaciones/dto/aceptacion-response.dto';
import { DocumentoLegalResponseDto } from '@/application/aceptaciones/dto/documento-legal-response.dto';
import { GetUser } from '@/infrastructure/shared/auth/decorators/get-user.decorator';
import { Usuario } from '@/entities/usuarios/usuario.entity';
import { RolesGuard, Roles } from '@/infrastructure/shared/guards/roles.guard';

@ApiTags('terms')
@Controller('terms')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('JWT-auth')
export class AceptacionesController {
  constructor(
    private readonly aceptarTerminosUseCase: AceptarTerminosUseCase,
    private readonly verificarAceptacionUseCase: VerificarAceptacionUseCase,
    private readonly obtenerDocumentosActivosUseCase: ObtenerDocumentosActivosUseCase,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  @Get('active-documents')
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
    type: [DocumentoLegalResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  async obtenerDocumentosActivos(): Promise<DocumentoLegalResponseDto[]> {
    return await this.obtenerDocumentosActivosUseCase.execute();
  }

  @Post('accept')
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
    description: 'Términos aceptados exitosamente. Retorna un array con las aceptaciones creadas.',
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
    description: 'Error de validación: debe aceptar todos los documentos legales activos o documentos inválidos',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example: 'Debe aceptar todos los documentos legales activos. Faltan: 2',
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado - Token JWT inválido, expirado o ausente',
  })
  async aceptarTerminos(
    @Body() aceptarTerminosDto: AceptarTerminosDto,
    @GetUser() usuario: Usuario,
    @Request() req: any,
  ): Promise<AceptacionResponseDto[]> {
    const ipAddress = req.ip || req.socket.remoteAddress || undefined;
    const userAgent = req.get('user-agent') || undefined;

    return await this.aceptarTerminosUseCase.execute(
      aceptarTerminosDto,
      usuario,
      ipAddress,
      userAgent,
    );
  }

  @Get('verify')
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
        message: { type: 'string', example: 'Todos los términos han sido aceptados' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'El usuario no ha aceptado los términos y condiciones',
  })
  async verificarAceptacion(@GetUser() usuario: Usuario): Promise<{
    aceptado: boolean;
    message: string;
  }> {
    await this.verificarAceptacionUseCase.execute(usuario);
    return {
      aceptado: true,
      message: 'Todos los términos han sido aceptados',
    };
  }

  @Post('accept-for-user/:userId')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Aceptar términos y políticas en nombre de otro usuario (Solo ADMIN)',
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
  async aceptarTerminosParaUsuario(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() aceptarTerminosDto: AceptarTerminosDto,
    @Request() req: any,
  ): Promise<AceptacionResponseDto[]> {
    // Obtener el usuario objetivo
    const usuarioObjetivo = await this.usuarioRepository.findOne({
      where: { id: userId },
      relations: ['persona', 'rolPrincipal'],
    });

    if (!usuarioObjetivo) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    const ipAddress = req.ip || req.socket.remoteAddress || undefined;
    const userAgent = req.get('user-agent') || undefined;

    return await this.aceptarTerminosUseCase.execute(
      aceptarTerminosDto,
      usuarioObjetivo,
      ipAddress,
      userAgent,
    );
  }
}

