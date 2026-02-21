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
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiConsumes,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles } from '@/infrastructure/shared/guards/roles.guard';
import { FileCompressionInterceptor } from '@/infrastructure/shared/interceptors/file-compression.interceptor';
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
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth('JWT-auth')
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
  @UseInterceptors(FileInterceptor('file'), FileCompressionInterceptor)
  @ApiOperation({
    summary: 'Subir un archivo (PDF o imagen)',
    description:
      'Sube un archivo PDF o imagen y retorna la URL donde se almacenó',
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
  @ApiResponse({
    status: 400,
    description: 'Archivo inválido o excede el tamaño máximo',
  })
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
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({
    summary:
      'Crear un nuevo material. Solo ADMIN e INSTRUCTOR pueden crear materiales.',
  })
  @ApiBody({ type: CreateMaterialDto })
  @ApiResponse({ status: 201, description: 'Material creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  create(@Body() createMaterialDto: CreateMaterialDto) {
    return this.createMaterialUseCase.execute(createMaterialDto);
  }

  @Get('capacitacion/:capacitacionId')
  @Roles('ADMIN', 'INSTRUCTOR', 'ALUMNO', 'CLIENTE', 'OPERADOR')
  @ApiOperation({
    summary: 'Obtener todos los materiales de una capacitación',
    description:
      'Todos los roles autenticados pueden ver materiales de capacitaciones.',
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
  findByCapacitacion(
    @Param('capacitacionId', ParseIntPipe) capacitacionId: number,
  ) {
    return this.findMaterialsByCapacitacionUseCase.execute(capacitacionId);
  }

  @Get(':id')
  @Roles('ADMIN', 'INSTRUCTOR', 'ALUMNO', 'CLIENTE', 'OPERADOR')
  @ApiOperation({
    summary:
      'Obtener un material por ID. Todos los roles autenticados pueden ver materiales.',
  })
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
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({
    summary:
      'Actualizar un material. Solo ADMIN e INSTRUCTOR pueden actualizar materiales.',
  })
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
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({
    summary:
      'Eliminar un material. Solo ADMIN e INSTRUCTOR pueden eliminar materiales.',
  })
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
