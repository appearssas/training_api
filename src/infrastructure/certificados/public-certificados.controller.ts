import {
  Controller,
  Get,
  Param,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { VerifyCertificadoUseCase } from '@/application/certificados/use-cases/verify-certificado.use-case';

/**
 * Controlador público de verificación de certificados
 * RF-32: Cualquier persona puede acceder a la URL pública de verificación
 * RF-33: Mostrar información del certificado (sin datos técnicos)
 * RF-34: No mostrar información técnica, de usuario, ni datos del administrador
 */
@ApiTags('public')
@Controller('public')
export class PublicCertificadosController {
  constructor(
    private readonly verifyCertificadoUseCase: VerifyCertificadoUseCase,
  ) {}

  @Get('verify/:token')
  @ApiOperation({
    summary: 'Verificar un certificado por token público',
    description: 'RF-32, RF-33, RF-34: Verificación pública de certificados sin autenticación',
  })
  @ApiParam({
    name: 'token',
    type: 'string',
    description: 'Token de verificación del certificado (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Información del certificado verificada',
    schema: {
      type: 'object',
      properties: {
        isValid: { type: 'boolean', example: true },
        isExpired: { type: 'boolean', example: false },
        fechaEmision: { type: 'string', format: 'date-time' },
        fechaVencimiento: { type: 'string', format: 'date-time', nullable: true },
        certificado: {
          type: 'object',
          properties: {
            numeroCertificado: { type: 'string' },
            // Solo información pública, sin datos técnicos (RF-34)
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Certificado no encontrado o inválido' })
  async verify(@Param('token') token: string) {
    try {
      const result = await this.verifyCertificadoUseCase.execute(token);

      // Extraer solo información pública (RF-34)
      const inscripcion = result.certificado.inscripcion as any;
      const estudiante = inscripcion?.estudiante as any;
      const capacitacion = inscripcion?.capacitacion as any;

      return {
        isValid: result.isValid,
        isExpired: result.isExpired,
        fechaEmision: result.fechaEmision,
        fechaVencimiento: result.fechaVencimiento,
        certificado: {
          numeroCertificado: result.certificado.numeroCertificado,
          // Información del conductor (RF-33)
          nombreCompleto: estudiante
            ? `${estudiante.nombres || ''} ${estudiante.apellidos || ''}`.trim()
            : 'N/A',
          numeroDocumento: estudiante?.numeroDocumento || 'N/A',
          // Información del curso (RF-33)
          nombreCurso: capacitacion?.titulo || 'N/A',
          // Estado (RF-33)
          estado: result.isExpired ? 'VENCIDO' : 'VÁLIDO',
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('Certificado no encontrado o inválido');
    }
  }
}

