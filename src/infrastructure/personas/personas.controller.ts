import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CreateConductorExternoUseCase } from '@/application/personas/use-cases/create-conductor-externo.use-case';
import { CreateConductorExternoDto } from '@/application/personas/dto/create-conductor-externo.dto';
import { ConductorExternoResponseDto } from '@/application/personas/dto/conductor-externo-response.dto';
import { RolesGuard, Roles } from '@/infrastructure/shared/guards/roles.guard';

@ApiTags('personas')
@Controller('personas')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth('JWT-auth')
export class PersonasController {
  constructor(
    private readonly createConductorExternoUseCase: CreateConductorExternoUseCase,
  ) {}

  @Post('conductores-externos')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear conductor externo',
    description: `Crea un conductor externo manualmente en el sistema. 

**Características importantes:**
- El conductor queda en estado "No habilitado" (usuario con \`habilitado: false\`)
- Se crea automáticamente un código de estudiante en formato EST{YYYY}{NNNNN}
- El conductor es marcado como externo (\`esExterno: true\`)
- Se genera un usuario con credenciales temporales que no puede acceder al sistema
- Solo disponible para usuarios con rol de administrador

**Datos obligatorios:**
- Número de documento
- Tipo de documento (CC, TI, CE, PA, RC, NIT)
- Nombres
- Apellidos

**Nota:** El conductor externo puede ser habilitado posteriormente para acceder al sistema.`,
  })
  @ApiBody({
    type: CreateConductorExternoDto,
    description: 'Datos del conductor externo a crear',
    examples: {
      ejemploMinimo: {
        summary: 'Ejemplo con datos mínimos obligatorios',
        description: 'Solo los campos obligatorios',
        value: {
          numeroDocumento: '1234567890',
          tipoDocumento: 'CC',
          nombres: 'Juan',
          apellidos: 'Pérez',
        },
      },
      ejemploCompleto: {
        summary: 'Ejemplo con todos los campos',
        description: 'Incluyendo todos los campos opcionales',
        value: {
          numeroDocumento: '1234567890',
          tipoDocumento: 'CC',
          nombres: 'Juan',
          apellidos: 'Pérez',
          email: 'juan.perez@example.com',
          telefono: '+573001234567',
          fechaNacimiento: '1990-01-15',
          genero: 'M',
          direccion: 'Calle 123 #45-67, Bogotá',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Conductor externo creado exitosamente en estado "No habilitado"',
    type: ConductorExternoResponseDto,
    examples: {
      ejemploRespuesta: {
        summary: 'Respuesta exitosa',
        value: {
          persona: {
            id: 1,
            numeroDocumento: '1234567890',
            tipoDocumento: 'CC',
            nombres: 'Juan',
            apellidos: 'Pérez',
            email: 'juan.perez@example.com',
            telefono: '+573001234567',
            fechaNacimiento: '1990-01-15T00:00:00.000Z',
            genero: 'M',
            direccion: 'Calle 123 #45-67',
            activo: true,
            fechaCreacion: '2025-01-15T10:30:00.000Z',
          },
          alumno: {
            id: 1,
            codigoEstudiante: 'EST20250001',
            esExterno: true,
            fechaIngreso: '2025-01-15T00:00:00.000Z',
            activo: true,
            fechaCreacion: '2025-01-15T10:30:00.000Z',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de registro inválidos o faltantes',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example: 'Validation failed',
        },
        errors: {
          type: 'array',
          items: { type: 'string' },
          example: [
            'El número de documento es obligatorio',
            'El tipo de documento es obligatorio',
            'Los nombres son obligatorios',
            'Los apellidos son obligatorios',
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado - Token JWT inválido, expirado o ausente',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: {
          type: 'string',
          example: 'Unauthorized',
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado - Se requiere rol de administrador (ADMIN)',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 403 },
        message: {
          type: 'string',
          example: 'Acceso denegado. Se requiere uno de los siguientes roles: ADMIN',
        },
        error: {
          type: 'string',
          example: 'Forbidden',
        },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Conflicto - El número de documento o email ya está registrado en el sistema',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: {
          type: 'string',
          example: 'El número de documento ya está registrado',
        },
        error: {
          type: 'string',
          example: 'Conflict',
        },
      },
    },
  })
  async createConductorExterno(
    @Body() createConductorExternoDto: CreateConductorExternoDto,
  ): Promise<ConductorExternoResponseDto> {
    return await this.createConductorExternoUseCase.execute(
      createConductorExternoDto,
    );
  }
}

