import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  CreateMaterialDto,
  UpdateMaterialDto,
} from '@/application/materiales/dto';
import { CreateMaterialUseCase } from '@/application/materiales/use-cases/create-material.use-case';
import { UpdateMaterialUseCase } from '@/application/materiales/use-cases/update-material.use-case';
import { RemoveMaterialUseCase } from '@/application/materiales/use-cases/remove-material.use-case';
import { FindMaterialsByCapacitacionUseCase } from '@/application/materiales/use-cases/find-materials-by-capacitacion.use-case';
import { FindOneMaterialUseCase } from '@/application/materiales/use-cases/find-one-material.use-case';
import { StorageService } from '@/infrastructure/shared/services/storage.service';

@ApiTags('materiales')
@Controller('materiales')
export class MaterialesController {
  constructor(
    private readonly createMaterialUseCase: CreateMaterialUseCase,
    private readonly updateMaterialUseCase: UpdateMaterialUseCase,
    private readonly removeMaterialUseCase: RemoveMaterialUseCase,
    private readonly findMaterialsByCapacitacionUseCase: FindMaterialsByCapacitacionUseCase,
    private readonly findOneMaterialUseCase: FindOneMaterialUseCase,
    private readonly storageService: StorageService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Subir un archivo (PDF o imagen)',
    description: 'Sube un archivo PDF o imagen y retorna la URL donde se almacenó',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo a subir (PDF, JPG, PNG, GIF, WEBP)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Archivo subido exitosamente',
    schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          example: '/storage/materials/1234567890-abc123.pdf',
        },
        originalName: {
          type: 'string',
          example: 'documento.pdf',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Archivo inválido o excede el tamaño máximo' })
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    const url = await this.storageService.saveImageOrPdf(file);

    return {
      url,
      originalName: file.originalname,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo material' })
  @ApiBody({ type: CreateMaterialDto })
  @ApiResponse({ status: 201, description: 'Material creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  create(@Body() createMaterialDto: CreateMaterialDto) {
    return this.createMaterialUseCase.execute(createMaterialDto);
  }

  @Get('capacitacion/:capacitacionId')
  @ApiOperation({
    summary: 'Obtener todos los materiales de una capacitación',
  })
  @ApiParam({
    name: 'capacitacionId',
    type: 'number',
    description: 'ID de la capacitación',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de materiales de la capacitación',
  })
  findByCapacitacion(@Param('capacitacionId', ParseIntPipe) capacitacionId: number) {
    return this.findMaterialsByCapacitacionUseCase.execute(capacitacionId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un material por ID' })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID del material',
  })
  @ApiResponse({ status: 200, description: 'Material encontrado' })
  @ApiResponse({ status: 404, description: 'Material no encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.findOneMaterialUseCase.execute(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un material' })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID del material',
  })
  @ApiBody({ type: UpdateMaterialDto })
  @ApiResponse({
    status: 200,
    description: 'Material actualizado exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Material no encontrado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMaterialDto: UpdateMaterialDto,
  ) {
    return this.updateMaterialUseCase.execute(id, updateMaterialDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un material' })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID del material',
  })
  @ApiResponse({
    status: 200,
    description: 'Material eliminado exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Material no encontrado' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.removeMaterialUseCase.execute(id);
  }
}

