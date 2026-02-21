import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { CertificateFormatsService } from './certificate-formats.service';
import { CreateCertificateFormatDto } from '@/application/certificate-formats/dto/create-certificate-format.dto';
import { UpdateCertificateFormatDto } from '@/application/certificate-formats/dto/update-certificate-format.dto';
import { UploadBackgroundDto } from '@/application/certificate-formats/dto/upload-background.dto';
import {
  CertificateFormat,
  CertificateFormatType,
} from '@/entities/certificate-formats/certificate-format.entity';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { Public } from '../shared/auth/decorators/public.decorator';

@ApiTags('Certificate Formats')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('certificate-formats')
export class CertificateFormatsController {
  constructor(
    private readonly certificateFormatsService: CertificateFormatsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo formato de certificado' })
  @ApiResponse({ status: 201, description: 'Formato creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async create(@Body() createDto: CreateCertificateFormatDto) {
    return await this.certificateFormatsService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los formatos de certificado' })
  @ApiResponse({ status: 200, description: 'Lista de formatos' })
  async findAll() {
    return await this.certificateFormatsService.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Obtener la configuración activa' })
  @ApiResponse({ status: 200, description: 'Configuración activa' })
  async findActive() {
    return await this.certificateFormatsService.findActive();
  }

  @Get('config')
  @ApiOperation({ summary: 'Obtener configuración activa como PdfConfig' })
  @ApiResponse({
    status: 200,
    description: 'Configuración en formato PdfConfig',
  })
  @UseGuards(JwtAuthGuard)
  async getActiveConfig(): Promise<unknown> {
    return await this.certificateFormatsService.getActiveConfig();
  }

  @Get('centralized')
  @ApiOperation({
    summary: 'Configuración centralizada del certificado (config + fondos)',
    description:
      'Una sola fuente de verdad: formato activo con config PDF (alimentos, sustancias, otros) y rutas relativas de fondos para la UI.',
  })
  @ApiResponse({
    status: 200,
    description: 'Configuración centralizada (sin rutas absolutas)',
  })
  async getCentralized(): Promise<unknown> {
    const data =
      await this.certificateFormatsService.getCentralizedCertificateConfig();
    if (!data) return null;
    const { activeFormatId, activo, config, fondos } = data;
    return { activeFormatId, activo, config, fondos };
  }

  @Get('config/public')
  @Public()
  @ApiOperation({
    summary:
      'Obtener configuración activa como PdfConfig (público, solo lectura)',
  })
  @ApiResponse({
    status: 200,
    description: 'Configuración en formato PdfConfig',
  })
  async getActiveConfigPublic(): Promise<unknown> {
    return await this.certificateFormatsService.getActiveConfig();
  }

  @Get('config/:tipo')
  @ApiOperation({ summary: 'Obtener configuración por tipo' })
  @ApiResponse({
    status: 200,
    description: 'Configuración del tipo especificado',
  })
  async getConfigByType(
    @Param('tipo') tipo: CertificateFormatType,
  ): Promise<unknown> {
    return await this.certificateFormatsService.getConfigByType(tipo);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un formato por ID' })
  @ApiResponse({ status: 200, description: 'Formato encontrado' })
  @ApiResponse({ status: 404, description: 'Formato no encontrado' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CertificateFormat> {
    return await this.certificateFormatsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un formato de certificado' })
  @ApiResponse({ status: 200, description: 'Formato actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Formato no encontrado' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateCertificateFormatDto,
  ): Promise<CertificateFormat> {
    return await this.certificateFormatsService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un formato de certificado' })
  @ApiResponse({ status: 200, description: 'Formato eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Formato no encontrado' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    await this.certificateFormatsService.remove(id);
    return { message: 'Formato eliminado exitosamente' };
  }

  @Post(':id/upload-background')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Subir fondo del certificado por formato (nombre por entidad)',
    description:
      'Sube un PNG de fondo para el formato indicado. El archivo se guarda con el nombre de la entidad certificadora (ej. fondoAndarDelLlano.png).',
  })
  @ApiParam({ name: 'id', description: 'ID del formato' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo PNG de fondo',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 201, description: 'Fondo subido' })
  @ApiResponse({ status: 400, description: 'Archivo inválido' })
  async uploadBackgroundForFormat(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }
    return await this.certificateFormatsService.uploadBackgroundForFormat(
      id,
      file,
    );
  }

  @Post('upload-background')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: '(Legacy) Subir fondo por tipo (formato activo)',
    description:
      'Sube un PNG de fondo para el formato activo según tipo alimentos/sustancias/otros.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        tipo: {
          enum: Object.values(CertificateFormatType),
          example: CertificateFormatType.OTROS,
        },
      },
      required: ['file', 'tipo'],
    },
  })
  @ApiResponse({ status: 201, description: 'Archivo subido' })
  @ApiResponse({ status: 400, description: 'Archivo inválido' })
  async uploadBackground(
    @UploadedFile() file: Express.Multer.File,
    @Query() query: UploadBackgroundDto,
  ) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }
    return await this.certificateFormatsService.uploadBackground(
      query.tipo,
      file,
    );
  }
}
