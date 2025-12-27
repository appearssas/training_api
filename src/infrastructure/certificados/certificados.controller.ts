import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../shared/auth/decorators/get-user.decorator';
import { RolesGuard, Roles } from '@/infrastructure/shared/guards/roles.guard';
import {
  CreateCertificadoDto,
  UpdateCertificadoDto,
} from '@/application/certificados/dto';
import { CreateCertificadoUseCase } from '@/application/certificados/use-cases/create-certificado.use-case';
import { FindAllCertificadosUseCase } from '@/application/certificados/use-cases/find-all-certificados.use-case';
import { FindOneCertificadoUseCase } from '@/application/certificados/use-cases/find-one-certificado.use-case';
import { UpdateCertificadoRetroactivoUseCase } from '@/application/certificados/use-cases/update-certificado-retroactivo.use-case';
import { PaginationDto } from '@/application/shared/dto/pagination.dto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';

/**
 * Controlador de Certificados
 * RF-22 a RF-24: Generación y gestión de certificados
 * RF-25 a RF-31: Certificados retroactivos
 */
@ApiTags('certificados')
@Controller('certificados')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth('JWT-auth')
export class CertificadosController {
  constructor(
    private readonly createCertificadoUseCase: CreateCertificadoUseCase,
    private readonly findAllCertificadosUseCase: FindAllCertificadosUseCase,
    private readonly findOneCertificadoUseCase: FindOneCertificadoUseCase,
    private readonly updateCertificadoRetroactivoUseCase: UpdateCertificadoRetroactivoUseCase,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Crear un nuevo certificado',
    description: 'RF-22: Generación automática de certificado PDF con QR. Solo ADMIN puede crear certificados.',
  })
  @ApiBody({ type: CreateCertificadoDto })
  @ApiResponse({ status: 201, description: 'Certificado creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Inscripción no encontrada' })
  create(@Body() createCertificadoDto: CreateCertificadoDto) {
    return this.createCertificadoUseCase.execute(createCertificadoDto);
  }

  @Post('list')
  @Roles('ADMIN', 'ALUMNO', 'CLIENTE', 'INSTRUCTOR', 'OPERADOR')
  @ApiOperation({
    summary: 'Obtener lista de certificados con paginación',
    description: 'Todos los roles autenticados pueden ver la lista de certificados.',
  })
  @ApiBody({ type: PaginationDto })
  @ApiResponse({ status: 200, description: 'Lista de certificados' })
  findAll(@Body() pagination: PaginationDto) {
    return this.findAllCertificadosUseCase.execute(pagination);
  }

  @Get(':id')
  @Roles('ADMIN', 'ALUMNO', 'CLIENTE', 'INSTRUCTOR', 'OPERADOR')
  @ApiOperation({ summary: 'Obtener un certificado por ID. Todos los roles autenticados pueden ver certificados.' })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID del certificado',
  })
  @ApiResponse({ status: 200, description: 'Certificado encontrado' })
  @ApiResponse({ status: 404, description: 'Certificado no encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.findOneCertificadoUseCase.execute(id);
  }

  @Get(':id/view')
  @Roles('ADMIN', 'ALUMNO', 'CLIENTE', 'INSTRUCTOR', 'OPERADOR')
  @ApiOperation({
    summary: 'Visualizar certificado en formato PDF',
    description: 'RF-24: Visualización de certificado PDF en navegador. Todos los roles autenticados pueden visualizar certificados.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID del certificado',
  })
  @ApiResponse({
    status: 200,
    description: 'PDF del certificado para visualización',
    content: {
      'application/pdf': {},
    },
  })
  @ApiResponse({ status: 404, description: 'Certificado no encontrado' })
  async viewPDF(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const certificado = await this.findOneCertificadoUseCase.execute(id);

    if (!certificado.urlCertificado) {
      return res.status(404).json({ message: 'PDF no disponible para este certificado' });
    }

    // Extraer nombre del archivo de la URL
    const fileName = certificado.urlCertificado.split('/').pop();
    const storagePath = this.configService.get<string>('PDF_STORAGE_PATH') || './storage/certificates';
    const filePath = path.join(storagePath, fileName || `certificado-${id}.pdf`);

    try {
      const fileBuffer = await fs.readFile(filePath);
      res.setHeader('Content-Type', 'application/pdf');
      // Usar 'inline' para visualización en navegador/iframe
      res.setHeader('Content-Disposition', `inline; filename="certificado-${id}.pdf"`);
      res.send(fileBuffer);
    } catch (error) {
      res.status(404).json({ message: 'Archivo PDF no encontrado' });
    }
  }

  @Get(':id/download')
  @Roles('ADMIN', 'ALUMNO', 'CLIENTE', 'INSTRUCTOR', 'OPERADOR')
  @ApiOperation({
    summary: 'Descargar certificado en formato PDF',
    description: 'RF-24: Descarga de certificado PDF. Todos los roles autenticados pueden descargar certificados.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID del certificado',
  })
  @ApiResponse({
    status: 200,
    description: 'PDF del certificado',
    content: {
      'application/pdf': {},
    },
  })
  @ApiResponse({ status: 404, description: 'Certificado no encontrado' })
  async downloadPDF(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const certificado = await this.findOneCertificadoUseCase.execute(id);

    if (!certificado.urlCertificado) {
      return res.status(404).json({ message: 'PDF no disponible para este certificado' });
    }

    // Extraer nombre del archivo de la URL
    const fileName = certificado.urlCertificado.split('/').pop();
    const storagePath = this.configService.get<string>('PDF_STORAGE_PATH') || './storage/certificates';
    const filePath = path.join(storagePath, fileName || `certificado-${id}.pdf`);

    try {
      const fileBuffer = await fs.readFile(filePath);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="certificado-${id}.pdf"`);
      res.send(fileBuffer);
    } catch (error) {
      res.status(404).json({ message: 'Archivo PDF no encontrado' });
    }
  }

  @Patch(':id/retroactivo')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Actualizar certificado con fecha retroactiva',
    description: 'RF-25 a RF-31: Solo administrador puede emitir certificado retroactivo',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID del certificado',
  })
  @ApiBody({ type: UpdateCertificadoDto })
  @ApiResponse({
    status: 200,
    description: 'Certificado actualizado exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Certificado no encontrado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  updateRetroactivo(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateCertificadoDto,
    @GetUser() user: any,
  ) {
    return this.updateCertificadoRetroactivoUseCase.execute(id, updateDto, user.id);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Eliminar un certificado. Solo ADMIN puede eliminar certificados.' })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID del certificado',
  })
  @ApiResponse({ status: 200, description: 'Certificado eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Certificado no encontrado' })
  remove(@Param('id', ParseIntPipe) id: number) {
    // TODO: Implementar caso de uso de eliminación si es necesario
    return { message: 'Eliminación de certificados no permitida por políticas de auditoría' };
  }
}

