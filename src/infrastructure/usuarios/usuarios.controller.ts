import {
  Controller,
  Inject,
  Optional,
  Get,
  Put,
  Delete,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  StreamableFile,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import type { QueueEvents } from 'bullmq';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles } from '@/infrastructure/shared/guards/roles.guard';
import { GetUser } from '@/infrastructure/shared/auth/decorators/get-user.decorator';
import { GetUsersUseCase } from '@/application/usuarios/use-cases/get-users.use-case';
import { GetUserByIdUseCase } from '@/application/usuarios/use-cases/get-user-by-id.use-case';
import { UpdateUserUseCase } from '@/application/usuarios/use-cases/update-user.use-case';
import { DeleteUserUseCase } from '@/application/usuarios/use-cases/delete-user.use-case';
import { CompleteUserTrainingsUseCase } from '@/application/usuarios/use-cases/complete-user-trainings.use-case';
import { CompleteUserTrainingsBulkUseCase } from '@/application/usuarios/use-cases/complete-user-trainings-bulk.use-case';
import { ListUsersDto } from '@/application/usuarios/dto/list-users.dto';
import { CompleteUserTrainingsResponseDto } from '@/application/usuarios/dto/complete-user-trainings-response.dto';
import { CompleteUserTrainingsBulkRequestDto } from '@/application/usuarios/dto/complete-user-trainings-bulk-request.dto';
import { CompleteUserTrainingsBulkResponseDto } from '@/application/usuarios/dto/complete-user-trainings-bulk-response.dto';
import { ExportUsersQueryDto } from '@/application/usuarios/dto/export-users.query.dto';
import { ExportUsersUseCase } from '@/application/usuarios/use-cases/export-users.use-case';
import { COMPLETE_TRAININGS_QUEUE } from './complete-trainings.processor';
import { UpdateUserDto } from '@/application/usuarios/dto/update-user.dto';
import {
  UserResponseDto,
  ListUsersResponseDto,
} from '@/application/usuarios/dto/user-response.dto';
import { Usuario } from '@/entities/usuarios/usuario.entity';

@ApiTags('users')
@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth('JWT-auth')
export class UsuariosController {
  constructor(
    private readonly getUsersUseCase: GetUsersUseCase,
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
    private readonly completeUserTrainingsUseCase: CompleteUserTrainingsUseCase,
    private readonly completeUserTrainingsBulkUseCase: CompleteUserTrainingsBulkUseCase,
    private readonly exportUsersUseCase: ExportUsersUseCase,
    @Optional()
    @InjectQueue(COMPLETE_TRAININGS_QUEUE)
    private readonly completeTrainingsQueue: Queue | null,
    @Optional()
    @Inject('COMPLETE_TRAININGS_QUEUE_EVENTS')
    private readonly completeTrainingsQueueEvents: QueueEvents | null,
  ) {}

  @Get()
  @Roles('ADMIN', 'CLIENTE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar usuarios',
    description: `Obtiene una lista paginada de usuarios con filtros opcionales.

**Filtros disponibles:**
- \`search\`: Búsqueda por nombre de usuario, email o número de documento
- \`role\`: Filtrar por rol (ADMIN, CLIENTE, INSTRUCTOR, ALUMNO, OPERADOR)
- \`habilitado\`: Filtrar por estado de habilitación
- \`activo\`: Filtrar por estado activo (por defecto solo muestra activos)

**Paginación:**
- \`page\`: Número de página (comienza en 1)
- \`limit\`: Cantidad de elementos por página

**Ordenamiento:**
- \`sortBy\`: Campo por el cual ordenar (id, username, fechaCreacion, ultimoAcceso)
- \`sortOrder\`: Orden (ASC, DESC)

**Nota:** Usuarios con rol ADMIN o CLIENTE pueden acceder a este endpoint.`,
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'role', required: false, type: String })
  @ApiQuery({ name: 'habilitado', required: false, type: Boolean })
  @ApiQuery({ name: 'activo', required: false, type: Boolean })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuarios obtenida exitosamente',
    type: ListUsersResponseDto,
    examples: {
      ejemploExitoso: {
        summary: 'Lista de usuarios con paginación',
        value: {
          data: [
            {
              id: 1,
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
                fechaActualizacion: '2025-01-15T10:30:00.000Z',
              },
              username: 'juan.perez',
              rolPrincipal: {
                id: 1,
                codigo: 'ADMIN',
                nombre: 'Administrador',
                activo: true,
              },
              habilitado: true,
              activo: true,
              debeCambiarPassword: false,
              ultimoAcceso: '2025-01-20T15:30:00.000Z',
              fechaCreacion: '2025-01-15T10:30:00.000Z',
              fechaActualizacion: '2025-01-15T10:30:00.000Z',
            },
          ],
          total: 100,
          page: 1,
          limit: 10,
          totalPages: 10,
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado - Token JWT inválido, expirado o ausente',
  })
  @ApiResponse({
    status: 403,
    description:
      'Acceso denegado - Se requiere rol de administrador (ADMIN) o cliente (CLIENTE)',
  })
  async findAll(
    @Query() listUsersDto: ListUsersDto,
    @GetUser() currentUser: Usuario,
  ): Promise<ListUsersResponseDto> {
    return await this.getUsersUseCase.execute(listUsersDto, currentUser);
  }

  @Get('export')
  @Roles('ADMIN', 'CLIENTE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Exportar usuarios (Excel o CSV)',
    description: `Genera un archivo con los mismos criterios de visibilidad que el listado (CLIENTE solo ve su empresa).

- **scope=all**: todos los registros que cumplan filtros; el servidor recorre por **ID ascendente** (orden estable, eficiente en BD). El listado en pantalla puede ordenarse distinto.
- **scope=page**: una sola página; **page** y **limit** obligatorios (limit máximo 2000).

Parámetros opcionales: search, role, habilitado, activo, sortBy, sortOrder.
**format**: \`xlsx\` (defecto) o \`csv\`.`,
  })
  @ApiResponse({
    status: 200,
    description: 'Archivo binario (descarga)',
  })
  @ApiResponse({
    status: 400,
    description: 'Parámetros inválidos (p. ej. page sin limit)',
  })
  @ApiResponse({
    status: 413,
    description: 'Demasiadas filas para una sola exportación (refinar filtros)',
  })
  @ApiResponse({
    status: 429,
    description: 'Demasiadas solicitudes de exportación (rate limit)',
  })
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 25, ttl: 60000 } })
  exportUsers(
    @Query() query: ExportUsersQueryDto,
    @GetUser() currentUser: Usuario,
  ): StreamableFile {
    const { stream, contentType, contentDisposition } =
      this.exportUsersUseCase.execute(query, currentUser);
    return new StreamableFile(stream, {
      type: contentType,
      disposition: contentDisposition,
    });
  }

  @Get(':id')
  @Roles('ADMIN', 'CLIENTE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener usuario por ID',
    description:
      'Obtiene los detalles de un usuario específico por su ID. Disponible para ADMIN y CLIENTE.',
  })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Usuario obtenido exitosamente',
    type: UserResponseDto,
    examples: {
      ejemploExitoso: {
        summary: 'Usuario encontrado',
        value: {
          id: 1,
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
            fechaActualizacion: '2025-01-15T10:30:00.000Z',
          },
          username: 'juan.perez',
          rolPrincipal: {
            id: 1,
            codigo: 'ADMIN',
            nombre: 'Administrador',
            activo: true,
          },
          habilitado: true,
          activo: true,
          debeCambiarPassword: false,
          ultimoAcceso: '2025-01-20T15:30:00.000Z',
          fechaCreacion: '2025-01-15T10:30:00.000Z',
          fechaActualizacion: '2025-01-15T10:30:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  @ApiResponse({
    status: 403,
    description:
      'Acceso denegado - Se requiere rol de administrador (ADMIN) o cliente (CLIENTE)',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserResponseDto> {
    return await this.getUserByIdUseCase.execute(id);
  }

  @Put(':id')
  @Roles('ADMIN', 'CLIENTE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar usuario',
    description: `Actualiza los datos de un usuario existente.

**Campos actualizables:**
- \`username\`: Nombre de usuario (debe ser único)
- \`rolPrincipalId\`: ID del rol principal
- \`habilitado\`: Estado de habilitación
- \`activo\`: Estado activo
- \`debeCambiarPassword\`: Indica si el usuario debe cambiar su contraseña

**Nota:** Usuarios con rol ADMIN o CLIENTE pueden actualizar usuarios.`,
  })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Usuario actualizado exitosamente',
    type: UserResponseDto,
    examples: {
      ejemploExitoso: {
        summary: 'Usuario actualizado',
        value: {
          id: 1,
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
            fechaActualizacion: '2025-01-20T15:30:00.000Z',
          },
          username: 'juan.perez.updated',
          rolPrincipal: {
            id: 2,
            codigo: 'INSTRUCTOR',
            nombre: 'Instructor',
            activo: true,
          },
          habilitado: true,
          activo: true,
          debeCambiarPassword: false,
          ultimoAcceso: '2025-01-20T15:30:00.000Z',
          fechaCreacion: '2025-01-15T10:30:00.000Z',
          fechaActualizacion: '2025-01-20T15:30:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de actualización inválidos',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflicto - El nombre de usuario ya está en uso',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  @ApiResponse({
    status: 403,
    description:
      'Acceso denegado - Se requiere rol de administrador (ADMIN) o cliente (CLIENTE)',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return await this.updateUserUseCase.execute(id, updateUserDto);
  }

  @Post('complete-trainings-bulk')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Completar capacitaciones de varios usuarios (solo ADMIN)',
    description: `Acepta una lista de IDs de usuario y ejecuta el mismo flujo de "completar capacitaciones" para cada uno.
Devuelve un resultado por usuario (inscripciones procesadas, mensaje y eventuales errores).
Solo disponible para usuarios con rol **ADMIN**.`,
  })
  @ApiResponse({
    status: 200,
    description: 'Resultados por usuario (éxitos y errores).',
    type: CompleteUserTrainingsBulkResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Body inválido (userIds vacío o no array de números)',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado - Solo rol ADMIN',
  })
  async completeTrainingsBulk(
    @Body() dto: CompleteUserTrainingsBulkRequestDto,
  ): Promise<CompleteUserTrainingsBulkResponseDto> {
    if (this.completeTrainingsQueue && this.completeTrainingsQueueEvents) {
      const job = await this.completeTrainingsQueue.add('bulk', {
        userIds: dto.userIds,
      });
      const timeoutMs = 300_000; // 5 minutos para lotes grandes
      const result = await job.waitUntilFinished(
        this.completeTrainingsQueueEvents,
        timeoutMs,
      );
      return result as CompleteUserTrainingsBulkResponseDto;
    }
    return this.completeUserTrainingsBulkUseCase.execute(dto.userIds);
  }

  @Post(':id/complete-trainings')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Completar capacitaciones del usuario (solo ADMIN)',
    description: `Marca todas las capacitaciones del usuario como completadas y lo habilita para certificar.

**Acciones realizadas por cada inscripción del usuario:**
- Marca todas las lecciones como completadas (progreso 100 %).
- Crea y finaliza un intento por cada evaluación del curso con respuestas correctas (única, múltiple y texto abierto).
- Actualiza la inscripción: estado completado, aprobado y habilitado para certificado.

Solo disponible para usuarios con rol **ADMIN**. El usuario debe tener una persona (estudiante) asociada.`,
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
    description: 'ID del usuario',
  })
  @ApiResponse({
    status: 200,
    description:
      'Capacitaciones completadas. Devuelve cantidad de inscripciones procesadas y eventuales errores por inscripción.',
    type: CompleteUserTrainingsResponseDto,
    examples: {
      exito: {
        summary: 'Procesamiento exitoso',
        value: {
          userId: 1,
          inscripcionesProcesadas: 3,
          message: 'Se completaron 3 capacitación(es) para el usuario.',
        },
      },
      conErrores: {
        summary: 'Procesamiento con algunos errores',
        value: {
          userId: 1,
          inscripcionesProcesadas: 2,
          message: 'Se completaron 2 capacitación(es) para el usuario.',
          errors: [
            'Inscripción 5 (capacitación 2): No tienes intentos disponibles. Máximo permitido: 1',
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado o sin persona (estudiante) asociada',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado - Solo rol ADMIN',
  })
  async completeTrainings(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CompleteUserTrainingsResponseDto> {
    return await this.completeUserTrainingsUseCase.execute(id);
  }

  @Delete(':id')
  @Roles('ADMIN', 'CLIENTE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar usuario (soft-delete)',
    description: `Realiza un soft-delete de un usuario, marcándolo como inactivo.

**Nota:**
- Esta operación no elimina físicamente el usuario de la base de datos
- Solo marca el campo \`activo\` como \`false\`
- El usuario ya no aparecerá en las listas por defecto (a menos que se filtre por \`activo=false\`)
- Usuarios con rol ADMIN o CLIENTE pueden eliminar usuarios.`,
  })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Usuario eliminado exitosamente (soft-delete)',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Usuario con ID 1 eliminado exitosamente (soft-delete)',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'El usuario ya está eliminado',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  @ApiResponse({
    status: 403,
    description:
      'Acceso denegado - Se requiere rol de administrador (ADMIN) o cliente (CLIENTE)',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    return await this.deleteUserUseCase.execute(id);
  }
}
