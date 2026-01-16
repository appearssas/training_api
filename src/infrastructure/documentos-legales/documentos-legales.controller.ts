import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { RolesGuard, Roles } from '@/infrastructure/shared/guards/roles.guard';
import { Public } from '@/infrastructure/shared/auth/decorators/public.decorator';
import { JwtAuthGuard } from '@/infrastructure/shared/guards/jwt-auth.guard';
import {
  CreateDocumentoLegalDto,
  UpdateDocumentoLegalDto,
  DocumentoLegalResponseDto,
} from '@/application/documentos-legales/dto';
import { CreateDocumentoLegalUseCase } from '@/application/documentos-legales/use-cases/create-documento-legal.use-case';
import { FindAllDocumentosLegalesUseCase } from '@/application/documentos-legales/use-cases/find-all-documentos-legales.use-case';
import { FindOneDocumentoLegalUseCase } from '@/application/documentos-legales/use-cases/find-one-documento-legal.use-case';
import { UpdateDocumentoLegalUseCase } from '@/application/documentos-legales/use-cases/update-documento-legal.use-case';
import { RemoveDocumentoLegalUseCase } from '@/application/documentos-legales/use-cases/remove-documento-legal.use-case';
import { DocumentoLegal } from '@/entities/documentos/documento-legal.entity';

@ApiTags('documentos-legales')
@Controller('documentos-legales')
@UseGuards(JwtAuthGuard)
export class DocumentosLegalesController {
  constructor(
    private readonly createDocumentoLegalUseCase: CreateDocumentoLegalUseCase,
    private readonly findAllDocumentosLegalesUseCase: FindAllDocumentosLegalesUseCase,
    private readonly findOneDocumentoLegalUseCase: FindOneDocumentoLegalUseCase,
    private readonly updateDocumentoLegalUseCase: UpdateDocumentoLegalUseCase,
    private readonly removeDocumentoLegalUseCase: RemoveDocumentoLegalUseCase,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear un nuevo documento legal',
    description:
      'Crea un nuevo documento legal en el sistema. Solo disponible para ADMIN. El documento se crea con la versión especificada (o 1.0 por defecto) y se asocia al usuario autenticado como creador.',
  })
  @ApiBody({ type: CreateDocumentoLegalDto })
  @ApiResponse({
    status: 201,
    description: 'Documento legal creado exitosamente',
    type: DocumentoLegalResponseDto,
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        tipo: { type: 'string', example: 'TERMINOS' },
        titulo: { type: 'string', example: 'Términos y Condiciones de Uso' },
        contenido: {
          type: 'string',
          example: '<p>Contenido del documento...</p>',
        },
        version: { type: 'string', example: '1.0' },
        requiereFirmaDigital: { type: 'boolean', example: false },
        activo: { type: 'boolean', example: true },
        fechaCreacion: { type: 'string', example: '2025-01-15T10:30:00.000Z' },
        fechaActualizacion: {
          type: 'string',
          example: '2025-01-15T10:30:00.000Z',
        },
        creadoPor: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            username: { type: 'string', example: 'admin' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Datos inválidos - El contenido del documento no puede estar vacío o los datos no cumplen con las validaciones',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example: 'El contenido del documento no puede estar vacío',
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado - Token JWT inválido, expirado o ausente',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado - Se requiere rol de administrador (ADMIN)',
  })
  async create(
    @Body() createDto: CreateDocumentoLegalDto,
    @Request() req: { user?: { id: number } },
  ): Promise<DocumentoLegal> {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }
    return this.createDocumentoLegalUseCase.execute(createDto, userId);
  }

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar todos los documentos legales (Público)',
    description:
      'Obtiene una lista de documentos legales ordenados por fecha de creación (más recientes primero). Puede filtrar por estado activo usando el parámetro query "activo". **Endpoint público** - No requiere autenticación. Útil para mostrar términos y políticas en el registro de usuarios.',
  })
  @ApiQuery({
    name: 'activo',
    required: false,
    type: Boolean,
    description:
      'Filtrar por estado activo. Valores: true (solo activos), false (solo inactivos). Si no se especifica, retorna todos.',
    example: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de documentos legales obtenida exitosamente',
    type: [DocumentoLegalResponseDto],
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          tipo: { type: 'string', example: 'TERMINOS' },
          titulo: { type: 'string', example: 'Términos y Condiciones de Uso' },
          contenido: {
            type: 'string',
            example: '<p>Contenido del documento...</p>',
          },
          version: { type: 'string', example: '1.0' },
          requiereFirmaDigital: { type: 'boolean', example: false },
          activo: { type: 'boolean', example: true },
          fechaCreacion: {
            type: 'string',
            example: '2025-01-15T10:30:00.000Z',
          },
          fechaActualizacion: {
            type: 'string',
            example: '2025-01-15T10:30:00.000Z',
          },
          creadoPor: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              username: { type: 'string', example: 'admin' },
            },
          },
        },
      },
    },
  })
  async findAll(@Query('activo') activo?: string): Promise<DocumentoLegal[]> {
    const activoBoolean =
      activo === 'true' ? true : activo === 'false' ? false : undefined;
    return this.findAllDocumentosLegalesUseCase.execute(activoBoolean);
  }

  @Get(':id')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener un documento legal por ID (Público)',
    description:
      'Obtiene los detalles completos de un documento legal específico, incluyendo información del usuario que lo creó. **Endpoint público** - No requiere autenticación. Útil para mostrar términos y políticas específicas en el registro de usuarios.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID único del documento legal a obtener',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Documento legal obtenido exitosamente',
    type: DocumentoLegalResponseDto,
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        tipo: { type: 'string', example: 'TERMINOS' },
        titulo: { type: 'string', example: 'Términos y Condiciones de Uso' },
        contenido: {
          type: 'string',
          example: '<p>Contenido del documento...</p>',
        },
        version: { type: 'string', example: '1.0' },
        requiereFirmaDigital: { type: 'boolean', example: false },
        activo: { type: 'boolean', example: true },
        fechaCreacion: { type: 'string', example: '2025-01-15T10:30:00.000Z' },
        fechaActualizacion: {
          type: 'string',
          example: '2025-01-15T10:30:00.000Z',
        },
        creadoPor: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            username: { type: 'string', example: 'admin' },
            nombres: { type: 'string', example: 'Juan' },
            apellidos: { type: 'string', example: 'Pérez' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Documento legal no encontrado',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: {
          type: 'string',
          example: 'Documento legal con ID 1 no encontrado',
        },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DocumentoLegal> {
    return this.findOneDocumentoLegalUseCase.execute(id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar un documento legal',
    description:
      'Actualiza los datos de un documento legal existente. Todos los campos son opcionales, solo se actualizarán los campos proporcionados. La fecha de actualización se actualiza automáticamente. Solo disponible para ADMIN.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID único del documento legal a actualizar',
    example: 1,
  })
  @ApiBody({
    type: UpdateDocumentoLegalDto,
    description: 'Datos a actualizar. Todos los campos son opcionales.',
  })
  @ApiResponse({
    status: 200,
    description: 'Documento legal actualizado exitosamente',
    type: DocumentoLegalResponseDto,
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        tipo: { type: 'string', example: 'TERMINOS' },
        titulo: {
          type: 'string',
          example: 'Términos y Condiciones de Uso - Actualizado',
        },
        contenido: {
          type: 'string',
          example: '<p>Contenido actualizado...</p>',
        },
        version: { type: 'string', example: '1.1' },
        requiereFirmaDigital: { type: 'boolean', example: true },
        activo: { type: 'boolean', example: true },
        fechaCreacion: { type: 'string', example: '2025-01-15T10:30:00.000Z' },
        fechaActualizacion: {
          type: 'string',
          example: '2025-01-16T14:20:00.000Z',
        },
        creadoPor: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            username: { type: 'string', example: 'admin' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Datos inválidos - Los datos proporcionados no cumplen con las validaciones',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'array',
          items: { type: 'string' },
          example: [
            'El tipo no puede exceder 50 caracteres',
            'La versión debe tener el formato X.Y',
          ],
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Documento legal no encontrado',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: {
          type: 'string',
          example: 'Documento legal con ID 1 no encontrado',
        },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado - Token JWT inválido, expirado o ausente',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado - Se requiere rol de administrador (ADMIN)',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateDocumentoLegalDto,
  ): Promise<DocumentoLegal> {
    return this.updateDocumentoLegalUseCase.execute(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar (desactivar) un documento legal',
    description:
      'Desactiva un documento legal en el sistema mediante soft delete (establece activo=false). El documento no se elimina físicamente de la base de datos, solo se marca como inactivo. Solo disponible para ADMIN.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID único del documento legal a desactivar',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Documento legal desactivado exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Documento legal desactivado exitosamente',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Documento legal no encontrado',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: {
          type: 'string',
          example: 'Documento legal con ID 1 no encontrado',
        },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado - Token JWT inválido, expirado o ausente',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado - Se requiere rol de administrador (ADMIN)',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    await this.removeDocumentoLegalUseCase.execute(id);
    return { message: 'Documento legal desactivado exitosamente' };
  }
}
