import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
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
import { GetUsersUseCase } from '@/application/usuarios/use-cases/get-users.use-case';
import { GetUserByIdUseCase } from '@/application/usuarios/use-cases/get-user-by-id.use-case';
import { UpdateUserUseCase } from '@/application/usuarios/use-cases/update-user.use-case';
import { DeleteUserUseCase } from '@/application/usuarios/use-cases/delete-user.use-case';
import { ListUsersDto } from '@/application/usuarios/dto/list-users.dto';
import { UpdateUserDto } from '@/application/usuarios/dto/update-user.dto';
import {
  UserResponseDto,
  ListUsersResponseDto,
} from '@/application/usuarios/dto/user-response.dto';

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
  ) {}

  @Get()
  @Roles('ADMIN')
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

**Nota:** Solo usuarios con rol ADMIN pueden acceder a este endpoint.`,
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
    description: 'Acceso denegado - Se requiere rol de administrador (ADMIN)',
  })
  async findAll(
    @Query() listUsersDto: ListUsersDto,
  ): Promise<ListUsersResponseDto> {
    return await this.getUsersUseCase.execute(listUsersDto);
  }

  @Get(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener usuario por ID',
    description: 'Obtiene los detalles de un usuario específico por su ID.',
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
    description: 'Acceso denegado - Se requiere rol de administrador (ADMIN)',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserResponseDto> {
    return await this.getUserByIdUseCase.execute(id);
  }

  @Put(':id')
  @Roles('ADMIN')
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

**Nota:** Solo usuarios con rol ADMIN pueden actualizar usuarios.`,
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
    description: 'Acceso denegado - Se requiere rol de administrador (ADMIN)',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return await this.updateUserUseCase.execute(id, updateUserDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar usuario (soft-delete)',
    description: `Realiza un soft-delete de un usuario, marcándolo como inactivo.

**Nota:**
- Esta operación no elimina físicamente el usuario de la base de datos
- Solo marca el campo \`activo\` como \`false\`
- El usuario ya no aparecerá en las listas por defecto (a menos que se filtre por \`activo=false\`)
- Solo usuarios con rol ADMIN pueden eliminar usuarios.`,
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
    description: 'Acceso denegado - Se requiere rol de administrador (ADMIN)',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    return await this.deleteUserUseCase.execute(id);
  }
}
