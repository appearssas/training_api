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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CertificateFormatsService } from './certificate-formats.service';
import { CreateCertificateFormatDto } from '@/application/certificate-formats/dto/create-certificate-format.dto';
import { UpdateCertificateFormatDto } from '@/application/certificate-formats/dto/update-certificate-format.dto';
import { UploadBackgroundDto } from '@/application/certificate-formats/dto/upload-background.dto';
import { CertificateFormatType } from '@/entities/certificate-formats/certificate-format.entity';
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
  @ApiResponse({ status: 200, description: 'Configuración en formato PdfConfig' })
  @UseGuards(JwtAuthGuard)
  async getActiveConfig() {
    return await this.certificateFormatsService.getActiveConfig();
  }

  @Get('config/public')
  @Public()
  @ApiOperation({ summary: 'Obtener configuración activa como PdfConfig (público, solo lectura)' })
  @ApiResponse({ status: 200, description: 'Configuración en formato PdfConfig' })
  async getActiveConfigPublic() {
    return await this.certificateFormatsService.getActiveConfig();
  }

  @Get('config/:tipo')
  @ApiOperation({ summary: 'Obtener configuración por tipo' })
  @ApiResponse({ status: 200, description: 'Configuración del tipo especificado' })
  async getConfigByType(@Param('tipo') tipo: CertificateFormatType) {
    return await this.certificateFormatsService.getConfigByType(tipo);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un formato por ID' })
  @ApiResponse({ status: 200, description: 'Formato encontrado' })
  @ApiResponse({ status: 404, description: 'Formato no encontrado' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.certificateFormatsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un formato de certificado' })
  @ApiResponse({ status: 200, description: 'Formato actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Formato no encontrado' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateCertificateFormatDto,
  ) {
    return await this.certificateFormatsService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un formato de certificado' })
  @ApiResponse({ status: 200, description: 'Formato eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Formato no encontrado' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.certificateFormatsService.remove(id);
    return { message: 'Formato eliminado exitosamente' };
  }

  @Post('upload-background')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Subir o actualizar archivo PNG de fondo' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo PNG de fondo del certificado',
        },
        tipo: {
          enum: Object.values(CertificateFormatType),
          description: 'Tipo de formato (alimentos, sustancias, otros)',
          example: CertificateFormatType.OTROS,
        },
      },
      required: ['file', 'tipo'],
    },
  })
  @ApiResponse({ status: 201, description: 'Archivo subido exitosamente' })
  @ApiResponse({ status: 400, description: 'Archivo inválido o tipo incorrecto' })
  async uploadBackground(
    @UploadedFile() file: Express.Multer.File,
    @Query() query: UploadBackgroundDto,
  ) {
    if (!file) {
      throw new Error('No se proporcionó ningún archivo');
    }

    return await this.certificateFormatsService.uploadBackground(
      query.tipo,
      file,
    );
  }
}
