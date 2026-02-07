import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DashboardService } from './dashboard.service';
import { GetUser } from '@/infrastructure/shared/auth/decorators/get-user.decorator';
import { Usuario } from '@/entities/usuarios/usuario.entity';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('JWT-auth')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener estadísticas del dashboard',
    description:
      'ADMIN: ve datos de todas las empresas. Usuarios institucionales (CLIENTE, etc.): solo datos de su empresa (persona.empresaId).',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas del dashboard',
  })
  async getStats(@GetUser() user: Usuario) {
    return await this.dashboardService.getStats(user);
  }
}
