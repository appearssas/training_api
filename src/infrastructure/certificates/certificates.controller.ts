import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Obtener reporte de certificados próximos a vencer' })
  @ApiResponse({
    status: 200,
    description: 'Reporte generado exitosamente',
  })
  async getExpiringCertificatesReport(@Query() dto: GetExpiringCertificatesDto) {
    return await this.getExpiringReportUseCase.execute(dto);
  }

  @Get('alert-configurations')
  @ApiOperation({ summary: 'Obtener configuraciones de alertas' })
  @ApiResponse({
    status: 200,
    description: 'Lista de configuraciones de alertas',
  })
  async getAlertConfigurations() {
    return await this.configAlertaRepository.find({
      order: { diasAntesVencimiento: 'DESC' },
    });
  }

  @Patch('alert-configurations/:id')
  @ApiOperation({ summary: 'Actualizar configuración de alerta' })
  @ApiResponse({
    status: 200,
    description: 'Configuración actualizada exitosamente',
  })
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
  @ApiOperation({ summary: 'Ejecutar verificación de vencimientos manualmente (testing)' })
  @ApiResponse({
    status: 200,
    description: 'Verificación ejecutada',
  })
  async checkExpirationsManually() {
    await this.checkExpirationsCron.executeManually();
    return {
      success: true,
      message: 'Verificación de vencimientos ejecutada manualmente',
    };
  }
}
