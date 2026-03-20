import {
  Controller,
  Get,
  Query,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Roles, RolesGuard } from '@/infrastructure/shared/guards/roles.guard';
import { GetUser } from '../shared/auth/decorators/get-user.decorator';
import { ExportCertificadosQueryDto } from '@/application/certificados/dto/export-certificados.query.dto';
import { ExportCertificadosUseCase } from '@/application/certificados/use-cases/export-certificados.use-case';

/**
 * Rutas GET estáticas bajo `/certificados` que deben registrarse **antes** que
 * `@Get(':idOrFilename')` en `CertificadosController`, para que segmentos como
 * `export` no se interpreten como ID (400 Identificador inválido).
 */
@ApiTags('certificados')
@Controller('certificados')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth('JWT-auth')
export class CertificadosExportController {
  constructor(
    private readonly exportCertificadosUseCase: ExportCertificadosUseCase,
  ) {}

  @Get('export')
  @Roles('ADMIN', 'ALUMNO', 'CLIENTE', 'INSTRUCTOR', 'OPERADOR')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 25, ttl: 60000 } })
  @ApiOperation({
    summary: 'Exportar certificados (CSV/XLSX)',
    description:
      'Permite exportar certificados filtrados en modo página o todos los resultados (lotes internos).',
  })
  export(
    @Query() query: ExportCertificadosQueryDto,
    @GetUser() user: any,
  ): StreamableFile {
    const rol = user?.rolPrincipal?.codigo ?? '';
    const personaId = user?.persona?.id ?? null;
    const empresaId =
      rol === 'CLIENTE' || rol === 'OPERADOR'
        ? (user?.persona?.empresaId ?? user?.persona?.empresa?.id ?? null)
        : null;

    const { stream, contentType, contentDisposition } =
      this.exportCertificadosUseCase.execute(query, {
        rol,
        personaId,
        empresaId: empresaId ?? undefined,
      });

    return new StreamableFile(stream, {
      type: contentType,
      disposition: contentDisposition,
    });
  }
}
