import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Usuario } from '@/entities/usuarios/usuario.entity';
import { IS_PUBLIC_KEY } from '../auth/decorators/public.decorator';

/**
 * Clave de metadatos para almacenar los roles requeridos
 * Siguiendo las mejores prácticas de NestJS: https://docs.nestjs.com/security/authorization
 */
export const ROLES_KEY = 'roles';

/**
 * Decorador para especificar qué roles pueden acceder a un endpoint
 * 
 * @example
 * @Roles('ADMIN')
 * @Post('conductores-externos')
 * createConductorExterno() { ... }
 * 
 * @example
 * @Roles('ADMIN', 'INSTRUCTOR')
 * @Get('capacitaciones')
 * getCapacitaciones() { ... }
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Guard para validar roles de usuario
 * 
 * Implementa la autorización basada en roles siguiendo las mejores prácticas de NestJS.
 * Ver documentación: https://docs.nestjs.com/security/authorization
 * 
 * El guard verifica que el usuario autenticado tenga uno de los roles requeridos
 * especificados mediante el decorador @Roles().
 * 
 * @example
 * // En el controller:
 * @UseGuards(AuthGuard('jwt'), RolesGuard)
 * @Roles('ADMIN')
 * @Post('endpoint')
 * myEndpoint() { ... }
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Verificar si el endpoint es público
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si es público, permitir el acceso sin verificar roles
    if (isPublic) {
      return true;
    }

    // Obtener los roles requeridos del decorador @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si no hay roles requeridos, permitir el acceso
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Obtener el usuario del request (debe estar autenticado previamente por AuthGuard)
    const request = context.switchToHttp().getRequest();
    const user: Usuario = request.user;

    // Verificar que el usuario esté autenticado
    if (!user) {
      throw new ForbiddenException(
        'Usuario no autenticado. Se requiere autenticación JWT.',
      );
    }

    // Verificar que el usuario tenga un rol asignado
    if (!user.rolPrincipal) {
      throw new ForbiddenException(
        'Usuario sin rol asignado. Contacte al administrador del sistema.',
      );
    }

    // Obtener el código del rol del usuario
    const userRole = user.rolPrincipal.codigo;

    // Verificar si el usuario tiene uno de los roles requeridos
    const hasRole = requiredRoles.includes(userRole);

    if (!hasRole) {
      throw new ForbiddenException(
        `Acceso denegado. Se requiere uno de los siguientes roles: ${requiredRoles.join(', ')}. Rol actual: ${userRole}`,
      );
    }

    return true;
  }
}

