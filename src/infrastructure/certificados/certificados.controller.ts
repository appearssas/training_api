import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  Res,
  UseGuards,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
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
import { UpdateCertificadoUseCase } from '@/application/certificados/use-cases/update-certificado.use-case';
import { RegenerateCertificatesUseCase } from '@/application/certificados/use-cases/regenerate-certificates.use-case';
import { PaginationDto } from '@/application/shared/dto/pagination.dto';
import * as fs from 'fs/promises';
import { createReadStream } from 'fs';
import { ConfigService } from '@nestjs/config';

import { PdfGeneratorService } from '@/infrastructure/shared/services/pdf-generator.service';
import { StorageService } from '@/infrastructure/shared/services/storage.service';
import { CertificadosRepositoryAdapter } from './certificados.repository.adapter';
import { EmpresasCapacitacionesService } from '../empresas/empresas-capacitaciones.service';

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
    private readonly updateCertificadoUseCase: UpdateCertificadoUseCase,
    private readonly configService: ConfigService,
    private readonly pdfGeneratorService: PdfGeneratorService,
    private readonly regenerateCertificatesUseCase: RegenerateCertificatesUseCase,
    private readonly storageService: StorageService,
    private readonly certificadosRepository: CertificadosRepositoryAdapter,
    private readonly empresasCapacitacionesService: EmpresasCapacitacionesService,
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
      'ADMIN: ve todos. INSTRUCTOR: solo de sus capacitaciones. ALUMNO: solo los propios. CLIENTE/OPERADOR: certificados de conductores/estudiantes de su empresa. Filtros en `filters`: `studentId`, `courseId`, `status` (valid|expired|revoked).',
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
  @ApiResponse({
    status: 401,
    description: 'No autorizado. Usar Authorize con JWT.',
  })
  findAll(@Body() pagination: PaginationDto, @GetUser() user: any) {
    const rol = user?.rolPrincipal?.codigo ?? '';
    const personaId = user?.persona?.id ?? null;
    const empresaId =
      rol === 'CLIENTE' || rol === 'OPERADOR'
        ? (user?.persona?.empresaId ?? user?.persona?.empresa?.id ?? null)
        : null;
    const userContext = {
      rol,
      personaId,
      empresaId: empresaId ?? undefined,
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
    @Body() pagination: PaginationDto | undefined,
    @GetUser() user: any,
  ) {
    const rol = user?.rolPrincipal?.codigo ?? '';
    const empresaId =
      rol === 'CLIENTE' || rol === 'OPERADOR'
        ? (user?.persona?.empresaId ?? user?.persona?.empresa?.id ?? null)
        : null;
    const userContext = {
      rol,
      personaId: user?.persona?.id ?? null,
      empresaId: empresaId ?? undefined,
    };
    return this.findByEstudianteCertificadosUseCase.execute(
      estudianteId,
      pagination,
      userContext,
    );
  }

  @Get('search/hashes')
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({
    summary: 'Buscar certificados por hash o texto (para editor de PDF)',
    description:
      'Devuelve una lista simplificada de certificados con hash, nombre del estudiante, curso y fecha. Útil para el editor de PDF.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de certificados con información básica',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          hashVerificacion: { type: 'string' },
          numeroCertificado: { type: 'string' },
          estudianteNombre: { type: 'string' },
          cursoNombre: { type: 'string' },
          fechaEmision: { type: 'string' },
        },
      },
    },
  })
  async searchHashes(
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ) {
    const searchTerm = search || '';
    const limitNum = limit ? parseInt(limit, 10) : 20;

    return this.certificadosRepository.searchForEditor(searchTerm, limitNum);
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
    @GetUser() user: any,
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
        } catch {
          continue;
        }
      }

      if (!found) {
        // Intentar regenerar si tiene el formato correcto
        const match = filename.match(/certificado-(\d+)-/);
        if (match && match[1]) {
          const id = parseInt(match[1], 10);
          return this.regenerateAndServePdf(id, res, 'inline', user);
        }
        throw new NotFoundException('Archivo no encontrado');
      }

      // Verificar acceso para PDFs de certificados (CLIENTE/OPERADOR solo de su empresa y permite descarga)
      const match = filename.match(/certificado-(\d+)-/);
      if (match && match[1]) {
        const id = parseInt(match[1], 10);
        const cert = await this.findOneCertificadoUseCase.execute(id);
        this.ensureCertificateAccessForUser(cert, user);
        await this.ensurePermiteDescargaCertificado(cert, user);
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
        this.ensureCertificateAccessForUser(result, user);
        return res.json(result);
      } catch (err) {
        if (err instanceof ForbiddenException) throw err;
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
  async viewPDF(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
    @GetUser() user: any,
  ) {
    return this.regenerateAndServePdf(id, res, 'inline', user);
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
    @GetUser() user: any,
  ) {
    return this.regenerateAndServePdf(id, res, 'attachment', user);
  }

  /**
   * Verifica que un usuario CLIENTE/OPERADOR solo acceda a certificados de estudiantes de su empresa.
   */
  private ensureCertificateAccessForUser(certificado: any, user: any): void {
    const rol = user?.rolPrincipal?.codigo ?? '';
    if (rol !== 'CLIENTE' && rol !== 'OPERADOR') return;
    const empresaId =
      user?.persona?.empresaId ?? user?.persona?.empresa?.id ?? null;
    if (empresaId == null) return;
    const estudianteEmpresaId =
      certificado?.inscripcion?.estudiante?.empresaId ??
      certificado?.inscripcion?.estudiante?.empresa?.id ??
      null;
    if (estudianteEmpresaId !== empresaId) {
      throw new ForbiddenException(
        'No tiene permiso para acceder a este certificado',
      );
    }
  }

  /**
   * Si el usuario es ALUMNO o CLIENTE/OPERADOR y el curso-empresa tiene descarga de certificado deshabilitada, lanza 403.
   */
  private async ensurePermiteDescargaCertificado(
    certificado: any,
    user: any,
  ): Promise<void> {
    const rol = user?.rolPrincipal?.codigo ?? '';
    if (rol === 'ADMIN' || rol === 'INSTRUCTOR') return;

    const empresaId =
      certificado?.inscripcion?.estudiante?.empresaId ??
      certificado?.inscripcion?.estudiante?.empresa?.id ??
      null;
    const capacitacionId = certificado?.inscripcion?.capacitacion?.id ?? null;
    if (empresaId == null || capacitacionId == null) return;

    const ce =
      await this.empresasCapacitacionesService.getByEmpresaAndCapacitacion(
        empresaId,
        capacitacionId,
      );
    if (ce && ce.permiteDescargaCertificado === false) {
      throw new ForbiddenException(
        'La descarga de certificados para este curso está deshabilitada por su organización.',
      );
    }
  }

  /**
   * Helper que intenta servir el PDF y si no existe, lo regenera.
   */
  private async regenerateAndServePdf(
    id: number,
    res: Response,
    disposition: 'inline' | 'attachment',
    user?: any,
  ) {
    const certificado = await this.findOneCertificadoUseCase.execute(id);
    if (user) {
      this.ensureCertificateAccessForUser(certificado, user);
      await this.ensurePermiteDescargaCertificado(certificado, user);
    }

    // Nombre base para el archivo
    const fileName = `certificado-${id}-${Date.now()}.pdf`;

    // Función auxiliar para enviar la respuesta
    const sendFile = (buffer: Buffer) => {
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
      const isLegacyLocalStorageUrl = certificado.urlCertificado.includes(
        '/storage/certificates/',
      );

      // Caso 1: URL absoluta (S3, CDN) pero NO local storage
      if (
        (certificado.urlCertificado.startsWith('http://') ||
          certificado.urlCertificado.startsWith('https://')) &&
        !isLegacyLocalStorageUrl
      ) {
        return res.redirect(certificado.urlCertificado);
      }

      // Caso 2: Ruta dinámica On-Demand (nueva arquitectura)
      if (
        certificado.urlCertificado.includes('/public/certificates/download/')
      ) {
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
        throw new Error('ENOENT'); // forzar regeneración/redirección si no parece archivo
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
      Number(user.id),
    );
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Editar fechas de un certificado',
    description:
      'Actualiza la fecha de expedición y/o fecha de caducidad del certificado. Solo ADMIN.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID del certificado',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fechaEmision: { type: 'string', format: 'date', example: '2024-12-01' },
        fechaVencimiento: {
          type: 'string',
          format: 'date',
          example: '2025-12-01',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Certificado actualizado exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Certificado no encontrado' })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos (ej. caducidad anterior a expedición)',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateCertificadoDto,
  ) {
    return this.updateCertificadoUseCase.execute(id, updateDto);
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
    void id; // reservado para futuro caso de uso de eliminación
    // TODO: Implementar caso de uso de eliminación si es necesario
    return {
      message:
        'Eliminación de certificados no permitida por políticas de auditoría',
    };
  }
}
