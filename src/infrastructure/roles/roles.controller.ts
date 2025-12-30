import {
  Controller,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles } from '@/infrastructure/shared/guards/roles.guard';
import { GetRolesUseCase } from '@/application/roles/use-cases/get-roles.use-case';
import { ListRolesResponseDto } from '@/application/roles/dto/role-response.dto';

@ApiTags('roles')
@Controller('roles')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth('JWT-auth')
export class RolesController {
  constructor(private readonly getRolesUseCase: GetRolesUseCase) {}

  @Get()
  @Roles('ADMIN', 'INSTRUCTOR', 'CLIENTE', 'OPERADOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener lista de roles',
    description: `Obtiene una lista de todos los roles activos disponibles en el sistema.

**Roles disponibles:**
- ADMIN: Administrador del sistema
- INSTRUCTOR: Instructor de capacitaciones
- ALUMNO: Estudiante/alumno
- CLIENTE: Cliente institucional
- OPERADOR: Operador del sistema

**Nota:** Solo se retornan los roles que están activos en el sistema.`,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de roles obtenida exitosamente',
    type: ListRolesResponseDto,
    examples: {
      ejemploExitoso: {
        summary: 'Lista de roles activos',
        value: {
          data: [
            {
              id: 1,
              nombre: 'Administrador',
              codigo: 'ADMIN',
              descripcion: 'Rol de administrador del sistema',
              activo: true,
              fechaCreacion: '2025-01-15T10:30:00.000Z',
            },
            {
              id: 2,
              nombre: 'Instructor',
              codigo: 'INSTRUCTOR',
              descripcion: 'Rol de instructor de capacitaciones',
              activo: true,
              fechaCreacion: '2025-01-15T10:30:00.000Z',
            },
            {
              id: 3,
              nombre: 'Alumno',
              codigo: 'ALUMNO',
              descripcion: 'Rol de estudiante/alumno',
              activo: true,
              fechaCreacion: '2025-01-15T10:30:00.000Z',
            },
          ],
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
    description: 'Acceso denegado - Se requiere uno de los roles permitidos',
  })
  async findAll(): Promise<ListRolesResponseDto> {
    return await this.getRolesUseCase.execute();
  }
}

