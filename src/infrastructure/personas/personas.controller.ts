import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CreateConductorExternoUseCase } from '@/application/personas/use-cases/create-conductor-externo.use-case';
import { CargaMasivaConductoresUseCase } from '@/application/personas/use-cases/carga-masiva-conductores.use-case';
import { CreateConductorExternoDto } from '@/application/personas/dto/create-conductor-externo.dto';
import { ConductorExternoResponseDto } from '@/application/personas/dto/conductor-externo-response.dto';
import { CargaMasivaResponseDto } from '@/application/personas/dto/carga-masiva-response.dto';
import { RolesGuard, Roles } from '@/infrastructure/shared/guards/roles.guard';

@ApiTags('people')
@Controller('people')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth('JWT-auth')
export class PersonasController {
  constructor(
    private readonly createConductorExternoUseCase: CreateConductorExternoUseCase,
    private readonly cargaMasivaConductoresUseCase: CargaMasivaConductoresUseCase,
  ) {}

  @Post('external-drivers')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear conductor externo',
    description: `Crea un conductor externo manualmente en el sistema. 

**Características importantes:**
- El conductor queda en estado "No habilitado" hasta que se registre el pago
- Se crea automáticamente un código de estudiante en formato EST{YYYY}{NNNNN}
- El conductor es marcado como externo (\`esExterno: true\`)
- Se genera un usuario con contraseña temporal que debe ser cambiada en el primer login
- Se envía un correo electrónico con las credenciales de acceso temporales
- Solo disponible para usuarios con rol de administrador

**Datos obligatorios:**
- Número de documento
- Tipo de documento (CC, TI, CE, PA, RC, NIT)
- Nombres
- Apellidos
- Email (obligatorio para enviar credenciales de acceso)

**Nota:** El usuario recibirá un correo con sus credenciales temporales y deberá cambiar la contraseña al iniciar sesión por primera vez.`,
  })
  @ApiBody({
    type: CreateConductorExternoDto,
    description: 'Datos del conductor externo a crear',
    examples: {
      ejemploMinimo: {
        summary: 'Ejemplo con datos mínimos obligatorios',
        description: 'Solo los campos obligatorios (incluye email)',
        value: {
          numeroDocumento: '1234567890',
          tipoDocumento: 'CC',
          nombres: 'Juan',
          apellidos: 'Pérez',
          email: 'juan.perez@example.com',
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
    description:
      'Conductor externo creado exitosamente. El conductor queda en estado "No habilitado" hasta que se registre el pago y se habilite manualmente.',
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
          example:
            'Acceso denegado. Se requiere uno de los siguientes roles: ADMIN',
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
    description:
      'Conflicto - El número de documento o email ya está registrado en el sistema',
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

  @Post('external-drivers/bulk-upload')
  @Roles('CLIENTE', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Carga masiva de conductores por CSV',
    description: `Permite cargar múltiples conductores externos mediante un archivo CSV.

**Requisitos del archivo CSV:**
- Formato: CSV con codificación UTF-8
- Separador: coma (,)
- Primera fila: encabezados (columnas)
- Columnas obligatorias: numeroDocumento, nombres, apellidos
- Columnas opcionales: tipoDocumento, email, telefono, fechaNacimiento, genero, direccion

**Ejemplo de formato CSV:**
\`\`\`
numeroDocumento,tipoDocumento,nombres,apellidos,email,telefono,fechaNacimiento,genero,direccion
1234567890,CC,Juan,Pérez,juan.perez@example.com,+573001234567,1990-01-15,M,Calle 123 #45-67
9876543210,CC,María,García,maria.garcia@example.com,+573009876543,1992-05-20,F,Carrera 45 #12-34
\`\`\`

**Proceso:**
1. El sistema valida el formato del archivo
2. Procesa cada fila del CSV
3. Registra los conductores válidos
4. Retorna un reporte con los éxitos y errores

**Nota:** Los conductores creados quedan en estado "No habilitado" hasta que se registre el pago y se habiliten manualmente.`,
  })
  @ApiBody({
    description: 'Archivo CSV con los datos de los conductores',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo CSV con los datos de los conductores',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Carga masiva procesada exitosamente',
    type: CargaMasivaResponseDto,
    examples: {
      ejemploExitoso: {
        summary: 'Carga exitosa con algunos errores',
        value: {
          totalFilas: 10,
          registradosExitosos: 8,
          filasConErrores: 2,
          errores: [
            {
              fila: 3,
              error: 'El número de documento ya está registrado',
              datos: {
                numeroDocumento: '1234567890',
                nombres: 'Juan',
                apellidos: 'Pérez',
              },
            },
            {
              fila: 7,
              error: 'El formato del email es inválido',
              datos: {
                numeroDocumento: '5555555555',
                nombres: 'Pedro',
                apellidos: 'González',
                email: 'email-invalido',
              },
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Error en el formato del archivo o datos inválidos',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado - Se requiere rol de CLIENTE o ADMIN',
  })
  async cargaMasivaConductores(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<CargaMasivaResponseDto> {
    if (!file) {
      throw new Error('No se subió ningún archivo');
    }

    if (!file.mimetype.includes('csv') && !file.originalname.endsWith('.csv')) {
      throw new Error('El archivo debe ser un CSV');
    }

    return await this.cargaMasivaConductoresUseCase.execute(file.buffer);
  }
}
