import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfiguracionAlerta } from '@/entities/alertas/configuracion-alerta.entity';
import { GetExpiringCertificatesDto } from '@/application/certificates/dto/get-expiring-certificates.dto';
import { UpdateAlertConfigDto } from '@/application/certificates/dto/update-alert-config.dto';
import { GetExpiringCertificatesReportUseCase } from '@/application/certificates/use-cases/get-expiring-certificates-report.use-case';
import { CheckExpirationsCron } from '@/application/certificates/jobs/check-expirations.cron';

@ApiTags('Certificates')
@Controller('certificates')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class CertificatesController {
  constructor(
    @InjectRepository(ConfiguracionAlerta)
    private readonly configAlertaRepository: Repository<ConfiguracionAlerta>,
    private readonly getExpiringReportUseCase: GetExpiringCertificatesReportUseCase,
    private readonly checkExpirationsCron: CheckExpirationsCron,
  ) {}

  @Get('expiring-report')
  @ApiOperation({
    summary: 'Obtener reporte de certificados próximos a vencer',
    description:
      'Obtiene un reporte paginado de certificados que están próximos a vencer, ya vencidos o activos. Permite filtrar por rango de fechas, estado y búsqueda por texto.',
  })
  @ApiQuery({ name: 'fechaVencimientoDesde', required: false, type: String })
  @ApiQuery({ name: 'fechaVencimientoHasta', required: false, type: String })
  @ApiQuery({
    name: 'estado',
    required: false,
    enum: ['ACTIVE', 'EXPIRING_SOON', 'EXPIRED'],
    description: 'Estado del certificado',
  })
  @ApiQuery({ name: 'busqueda', required: false, type: String })
  @ApiQuery({ name: 'pagina', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limite', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Reporte generado exitosamente',
    schema: {
      type: 'object',
      properties: {
        certificados: {
          type: 'array',
          items: { type: 'object' },
        },
        total: { type: 'number', example: 50 },
        pagina: { type: 'number', example: 1 },
        totalPaginas: { type: 'number', example: 5 },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 400, description: 'Parámetros de consulta inválidos' })
  async getExpiringCertificatesReport(@Query() dto: GetExpiringCertificatesDto) {
    return await this.getExpiringReportUseCase.execute(dto);
  }

  @Get('alert-configurations')
  @ApiOperation({
    summary: 'Obtener configuraciones de alertas',
    description:
      'Obtiene todas las configuraciones de alertas ordenadas por días antes del vencimiento (descendente)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de configuraciones de alertas',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          diasAntesVencimiento: { type: 'number', example: 30 },
          activo: { type: 'boolean', example: true },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getAlertConfigurations() {
    return await this.configAlertaRepository.find({
      order: { diasAntesVencimiento: 'DESC' },
    });
  }

  @Patch('alert-configurations/:id')
  @ApiOperation({
    summary: 'Actualizar configuración de alerta',
    description:
      'Actualiza una configuración de alerta existente. Permite modificar los días antes del vencimiento y el estado activo/inactivo.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID de la configuración de alerta',
    example: 1,
  })
  @ApiBody({ type: UpdateAlertConfigDto })
  @ApiResponse({
    status: 200,
    description: 'Configuración actualizada exitosamente',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        diasAntesVencimiento: { type: 'number', example: 30 },
        activo: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Configuración no encontrada' })
  async updateAlertConfiguration(
    @Param('id') id: number,
    @Body() dto: UpdateAlertConfigDto,
  ) {
    const config = await this.configAlertaRepository.findOne({
      where: { id },
    });

    if (!config) {
      throw new Error('Configuración no encontrada');
    }

    config.diasAntesVencimiento = dto.diasAntesVencimiento;
    config.activo = dto.activo;

    return await this.configAlertaRepository.save(config);
  }

  @Get('check-expirations-manual')
  @ApiOperation({
    summary: 'Ejecutar verificación de vencimientos manualmente (testing)',
    description:
      'Ejecuta manualmente el proceso de verificación de certificados próximos a vencer y envía las alertas correspondientes. Útil para testing y ejecución manual del proceso que normalmente se ejecuta automáticamente mediante cron.',
  })
  @ApiResponse({
    status: 200,
    description: 'Verificación ejecutada',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Verificación de vencimientos ejecutada manualmente',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 500, description: 'Error al ejecutar la verificación' })
  async checkExpirationsManually() {
    await this.checkExpirationsCron.executeManually();
    return {
      success: true,
      message: 'Verificación de vencimientos ejecutada manualmente',
    };
  }
}
