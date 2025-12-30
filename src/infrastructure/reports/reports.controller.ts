import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService, ReportFilters } from './reports.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('reports')
@UseGuards(AuthGuard('jwt'))
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('stats')
  async getStats(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('courseId') courseId?: number,
    @Query('status') status?: string,
  ) {
    const filters: ReportFilters = {
      dateFrom,
      dateTo,
      courseId,
      status,
    };
    return this.reportsService.getStats(filters);
  }
}
