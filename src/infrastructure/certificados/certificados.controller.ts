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
import { RegenerateCertificatesUseCase } from '@/application/certificados/use-cases/regenerate-certificates.use-case';
import { PaginationDto } from '@/application/shared/dto/pagination.dto';
import * as fs from 'fs/promises';
import { createReadStream } from 'fs';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';

import { PdfGeneratorService } from '@/infrastructure/shared/services/pdf-generator.service';

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
    private readonly pdfGeneratorService: PdfGeneratorService,
    private readonly regenerateCertificatesUseCase: RegenerateCertificatesUseCase,
  ) {}

  @Post('generate')
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({ summary: 'Generar certificado manualmente' })
  async generate(@Body() createCertificadoDto: CreateCertificadoDto) {
    return this.createCertificadoUseCase.execute(createCertificadoDto);
  }

  @Post('regenerate-all')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Regenerar certificados para todas las evaluaciones aprobadas faltantes' })
  async regenerateAll() {
    return this.regenerateCertificatesUseCase.execute();
  }

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
    return this.regenerateAndServePdf(id, res, 'inline');
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
    return this.regenerateAndServePdf(id, res, 'attachment');
  }

  /**
   * Helper que intenta servir el PDF y si no existe, lo regenera.
   */
  private async regenerateAndServePdf(id: number, res: Response, disposition: 'inline' | 'attachment') {
    const certificado = await this.findOneCertificadoUseCase.execute(id);
    
    // Determinar la ruta del archivo
    const storagePath = this.configService.get<string>('PDF_STORAGE_PATH') || './storage/certificates';
    let filePath: string;
    let fileName: string;

    if (certificado.urlCertificado) {
        // Si urlCertificado es una URL completa (http://...) o ruta relativa, extraemos el nombre del archivo
        // Usamos split proactivamente para manejar tanto / como \
        const basename = certificado.urlCertificado.split(/[/\\]/).pop();
        fileName = basename || `certificado-${id}.pdf`;
        
        // RE-CONSTRUIR la ruta local completa. NO usar urlCertificado directamente.
        filePath = path.join(storagePath, fileName);
    } else {
        // Fallback al nombre default
        fileName = `certificado-${id}.pdf`;
        filePath = path.join(storagePath, fileName);
    }

    // Función auxiliar para enviar la respuesta
    const sendFile = async (buffer: Buffer) => {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `${disposition}; filename="${fileName}"`);
      res.send(buffer);
    };

    try {
      // Intentar leer del disco primero
      const fileBuffer = await fs.readFile(filePath);
      return sendFile(fileBuffer);
    } catch (error: any) {
      // Si el error es que no existe el archivo, lo regeneramos
      if (error.code === 'ENOENT') {
        console.log(`⚠️ PDF para certificado ${id} no encontrado en disco. Regenerando...`);
        try {
          // Generar el PDF usando el servicio
          const pdfBuffer = await this.pdfGeneratorService.generateCertificate(certificado);
          
          // Asegurarse de que el directorio exista y guardar el archivo para la próxima
          await fs.mkdir(storagePath, { recursive: true });
          await fs.writeFile(filePath, pdfBuffer);
          console.log(`✅ PDF regenerado y guardado en: ${filePath}`);

          // Si el certificado no tenía URL o era incorrecta, actualizarla
          const baseUrl = this.configService.get<string>('APP_URL') || 'http://localhost:3000';
          const newUrl = `${baseUrl}/certificates/${fileName}`;
          
          // No necesitamos esperar a que se guarde en BD para responder al usuario
          // Usamos un update directo para no interferir con la respuesta
          // (Opcional, dependiendo de si queremos actualizar la URL en la BD)
          // await this.updateUrl(id, newUrl); 

          return sendFile(pdfBuffer);
        } catch (genError) {
          console.error(`❌ Error fatal regenerando PDF para certificado ${id}:`, genError);
          return res.status(500).json({ message: 'Error interno regenerando el certificado PDF.' });
        }
      }
      
      // Otro tipo de error de lectura
      console.error(`❌ Error leyendo archivo PDF para certificado ${id}:`, error);
      return res.status(404).json({ message: 'Error al acceder al archivo del certificado.' });
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

