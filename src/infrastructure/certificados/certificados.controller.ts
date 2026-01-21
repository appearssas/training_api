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
  BadRequestException,
  NotFoundException,
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
import { FindByEstudianteCertificadosUseCase } from '@/application/certificados/use-cases/find-by-estudiante-certificados.use-case';
import { UpdateCertificadoRetroactivoUseCase } from '@/application/certificados/use-cases/update-certificado-retroactivo.use-case';
import { RegenerateCertificatesUseCase } from '@/application/certificados/use-cases/regenerate-certificates.use-case';
import { PaginationDto } from '@/application/shared/dto/pagination.dto';
import * as fs from 'fs/promises';
import { createReadStream } from 'fs';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';

import { PdfGeneratorService } from '@/infrastructure/shared/services/pdf-generator.service';
import { StorageService } from '@/infrastructure/shared/services/storage.service';

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
    private readonly findByEstudianteCertificadosUseCase: FindByEstudianteCertificadosUseCase,
    private readonly updateCertificadoRetroactivoUseCase: UpdateCertificadoRetroactivoUseCase,
    private readonly configService: ConfigService,
    private readonly pdfGeneratorService: PdfGeneratorService,
    private readonly regenerateCertificatesUseCase: RegenerateCertificatesUseCase,
    private readonly storageService: StorageService,
  ) {}

  @Post('generate')
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({ summary: 'Generar certificado manualmente' })
  async generate(@Body() createCertificadoDto: CreateCertificadoDto) {
    return this.createCertificadoUseCase.execute(createCertificadoDto);
  }

  @Post('regenerate-all')
  @Roles('ADMIN')
  @ApiOperation({
    summary:
      'Regenerar certificados para todas las evaluaciones aprobadas faltantes',
  })
  async regenerateAll() {
    return this.regenerateCertificatesUseCase.execute();
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Crear un nuevo certificado',
    description:
      'RF-22: Generación automática de certificado PDF con QR. Solo ADMIN puede crear certificados.',
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
    description:
      'ADMIN: ve todos los certificados. INSTRUCTOR: solo los de capacitaciones donde es instructor. ALUMNO/CLIENTE/OPERADOR: solo los propios (donde es el estudiante). Requiere JWT. Filtros en `filters`: `studentId`, `courseId`, `status` (valid|expired|revoked).',
  })
  @ApiBody({
    type: PaginationDto,
    examples: {
      minimo: {
        summary: 'Mínimo (page y limit)',
        value: { page: 1, limit: 10 },
      },
      conBusqueda: {
        summary: 'Con búsqueda',
        value: { page: 1, limit: 10, search: 'Juan' },
      },
      conFiltros: {
        summary: 'Con filtros',
        value: {
          page: 1,
          limit: 10,
          filters: { studentId: 1, courseId: 2, status: 'valid' },
          sortField: 'fechaEmision',
          sortOrder: 'DESC',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de certificados con paginación',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array', items: { type: 'object' } },
        total: { type: 'number', example: 25 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 10 },
        totalPages: { type: 'number', example: 3 },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado. Usar Authorize con JWT.' })
  findAll(@Body() pagination: PaginationDto, @GetUser() user: any) {
    const userContext = {
      rol: user?.rolPrincipal?.codigo ?? '',
      personaId: user?.persona?.id ?? null,
    };
    return this.findAllCertificadosUseCase.execute(pagination, userContext);
  }

  @Post('estudiante/:estudianteId')
  @Roles('ADMIN', 'ALUMNO', 'CLIENTE', 'INSTRUCTOR', 'OPERADOR')
  @ApiOperation({
    summary: 'Obtener certificados de un estudiante',
    description:
      'Obtiene todos los certificados de un estudiante específico con paginación. Útil para ver el historial de certificados de un estudiante. Todos los roles autenticados pueden ver certificados de estudiantes.',
  })
  @ApiParam({
    name: 'estudianteId',
    type: 'number',
    description: 'ID del estudiante (Persona)',
    example: 1,
  })
  @ApiBody({ type: PaginationDto, required: false })
  @ApiResponse({
    status: 200,
    description: 'Lista de certificados del estudiante',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { type: 'object' },
        },
        total: { type: 'number', example: 5 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 10 },
        totalPages: { type: 'number', example: 1 },
      },
    },
  })
  findByEstudiante(
    @Param('estudianteId', ParseIntPipe) estudianteId: number,
    @Body() pagination?: PaginationDto,
  ) {
    return this.findByEstudianteCertificadosUseCase.execute(
      estudianteId,
      pagination,
    );
  }

  @Get(':idOrFilename')
  @Roles('ADMIN', 'ALUMNO', 'CLIENTE', 'INSTRUCTOR', 'OPERADOR')
  @ApiOperation({
    summary: 'Obtener certificado por ID o servir archivo PDF',
    description:
      'Maneja solicitudes tanto para detalles de certificado (ID numérico) como para archivos PDF (.pdf).',
  })
  async findOneOrFile(
    @Param('idOrFilename') idOrFilename: string,
    @Res() res: Response,
  ) {
    // 1. Si es PDF, servir el archivo
    if (idOrFilename.endsWith('.pdf')) {
      const filename = idOrFilename;
      console.log(`📂 [findOneOrFile] Sirviendo archivo: ${filename}`);

      const possiblePaths = [
        `/certificates/${filename}`,
        `/storage/certificates/${filename}`,
        filename,
      ];

      let filePath = '';
      let found = false;

      for (const p of possiblePaths) {
        try {
          filePath = this.storageService.getFilePath(p);
          await fs.access(filePath);
          found = true;
          break;
        } catch (e) {
          continue;
        }
      }

      if (!found) {
        // Intentar regenerar si tiene el formato correcto
        const match = filename.match(/certificado-(\d+)-/);
        if (match && match[1]) {
          const id = parseInt(match[1], 10);
          return this.regenerateAndServePdf(id, res, 'inline');
        }
        throw new NotFoundException('Archivo no encontrado');
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      const fileStream = createReadStream(filePath);
      fileStream.pipe(res);
      return;
    }

    // 2. Si es numérico, devolver detalles (JSON)
    if (!isNaN(Number(idOrFilename))) {
      const id = parseInt(idOrFilename, 10);
      try {
        const result = await this.findOneCertificadoUseCase.execute(id);
        return res.json(result);
      } catch (error) {
        throw new NotFoundException('Certificado no encontrado');
      }
    }

    // 3. Si no es ninguno, error
    throw new BadRequestException('Identificador inválido');
  }

  @Get(':id/view')
  @Roles('ADMIN', 'ALUMNO', 'CLIENTE', 'INSTRUCTOR', 'OPERADOR')
  @ApiOperation({
    summary: 'Visualizar certificado en formato PDF',
    description:
      'RF-24: Visualización de certificado PDF en navegador. Todos los roles autenticados pueden visualizar certificados.',
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
  async viewPDF(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    return this.regenerateAndServePdf(id, res, 'inline');
  }

  @Get(':id/download')
  @Roles('ADMIN', 'ALUMNO', 'CLIENTE', 'INSTRUCTOR', 'OPERADOR')
  @ApiOperation({
    summary: 'Descargar certificado en formato PDF',
    description:
      'RF-24: Descarga de certificado PDF. Todos los roles autenticados pueden descargar certificados.',
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
    return this.regenerateAndServePdf(id, res, 'attachment');
  }

  /**
   * Helper que intenta servir el PDF y si no existe, lo regenera.
   */
  private async regenerateAndServePdf(
    id: number,
    res: Response,
    disposition: 'inline' | 'attachment',
  ) {
    const certificado = await this.findOneCertificadoUseCase.execute(id);

    // Nombre base para el archivo
    const fileName = `certificado-${id}-${Date.now()}.pdf`;

    // Función auxiliar para enviar la respuesta
    const sendFile = async (buffer: Buffer) => {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `${disposition}; filename="${fileName}"`,
      );
      res.send(buffer);
    };

    // Si hay URL de certificado y es de S3/CloudFront o ruta dinámica, intentar redirigir
    // Si hay URL de certificado y es de S3/CloudFront o ruta dinámica, intentar redirigir
    if (certificado.urlCertificado) {
      // FIX PROD: Ignorar URLs locales antiguas que apuntan a storage (ej: http://localhost:3000/storage/...)
      // Estas URLs son inaccesibles en producción o desde el cliente si apuntan al contenedor.
      const isLegacyLocalStorageUrl = certificado.urlCertificado.includes('/storage/certificates/');

      // Caso 1: URL absoluta (S3, CDN) pero NO local storage
      if ((certificado.urlCertificado.startsWith('http://') || certificado.urlCertificado.startsWith('https://')) && !isLegacyLocalStorageUrl) {
        return res.redirect(certificado.urlCertificado);
      }
      
      // Caso 2: Ruta dinámica On-Demand (nueva arquitectura)
      if (certificado.urlCertificado.includes('/public/certificates/download/')) {
        // Redirigir al controlador público que genera en memoria
        return res.redirect(certificado.urlCertificado);
      }
    }

    // Si es almacenamiento local, intentar leer del disco
    try {
      const filePath = this.storageService.getFilePath(
        certificado.urlCertificado || `/storage/certificates/${fileName}`,
      );
      // Validar que intenta leer un archivo real y no una ruta de API malinterpretada
      if (!filePath.endsWith('.pdf')) {
         throw { code: 'ENOENT' }; // forzar regeneración/redirección si no parece archivo
      }

      const fileBuffer = await fs.readFile(filePath);
      return sendFile(fileBuffer);
    } catch (error: any) {
      // Si el error es que no existe el archivo, lo regeneramos (On-Demand fallback)
      if (error.code === 'ENOENT') {
        console.log(
          `⚠️ PDF para certificado ${id} no encontrado en disco. Generando On-Demand...`,
        );
        try {
          // Generar el PDF usando el servicio (en memoria)
          const pdfBuffer =
            await this.pdfGeneratorService.generateCertificate(certificado);

          // CAMBIO ARQUITECTURA: NO GUARDAR EN DISCO.
          // Solo servir el buffer generado.
          // const url = await this.storageService.saveBuffer(...); <-- ELIMINADO

          return sendFile(pdfBuffer);
        } catch (genError) {
          console.error(
            `❌ Error fatal regenerando PDF para certificado ${id}:`,
            genError,
          );
          return res
            .status(500)
            .json({ message: 'Error interno regenerando el certificado PDF.' });
        }
      }

      // Otro tipo de error de lectura
      console.error(
        `❌ Error leyendo archivo PDF para certificado ${id}:`,
        error,
      );
      return res
        .status(404)
        .json({ message: 'Error al acceder al archivo del certificado.' });
    }
  }

  @Patch(':id/retroactivo')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Actualizar certificado con fecha retroactiva',
    description:
      'RF-25 a RF-31: Solo administrador puede emitir certificado retroactivo',
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
    return this.updateCertificadoRetroactivoUseCase.execute(
      id,
      updateDto,
      user.id,
    );
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Eliminar un certificado. Solo ADMIN puede eliminar certificados.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID del certificado',
  })
  @ApiResponse({
    status: 200,
    description: 'Certificado eliminado exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Certificado no encontrado' })
  remove(@Param('id', ParseIntPipe) id: number) {
    // TODO: Implementar caso de uso de eliminación si es necesario
    return {
      message:
        'Eliminación de certificados no permitida por políticas de auditoría',
    };
  }
}
