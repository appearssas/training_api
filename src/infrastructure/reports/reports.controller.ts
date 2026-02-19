import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ReportsService, ReportFilters } from './reports.service';
import { GetUser } from '@/infrastructure/shared/auth/decorators/get-user.decorator';
import { Usuario } from '@/entities/usuarios/usuario.entity';
import { RolesGuard, Roles } from '@/infrastructure/shared/guards/roles.guard';

@ApiTags('reports')
@Controller('reports')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'CLIENTE', 'OPERADOR')
@ApiBearerAuth('JWT-auth')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('stats')
  @ApiOperation({
    summary: 'Estadísticas de reportes',
    description:
      'ADMIN: información general de toda la plataforma. CLIENTE y OPERADOR: solo datos de su empresa.',
  })
  @ApiResponse({ status: 200, description: 'Estadísticas de reportes' })
  async getStats(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('courseId') courseId?: number,
    @Query('status') status?: string,
    @GetUser() user?: Usuario,
  ) {
    const filters: ReportFilters = { dateFrom, dateTo, courseId, status };
    return this.reportsService.getStats(filters, user);
  }
}
