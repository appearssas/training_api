import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles } from '@/infrastructure/shared/guards/roles.guard';
import { RepresentantesService } from './representantes.service';
import {
  CreateRepresentanteDto,
  UpdateRepresentanteDto,
} from '@/application/catalogos/dto';

@ApiTags('catalogos')
@Controller('catalogos/entes-certificadores/:enteId/representantes')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth('JWT-auth')
export class EntesCertificadoresRepresentantesController {
  constructor(private readonly service: RepresentantesService) {}

  @Get()
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({
    summary: 'Listar representantes del ente',
    description:
      'Representantes legales del ente certificador. Solo ADMIN puede ver inactivos.',
  })
  @ApiQuery({ name: 'activo', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Lista de representantes del ente' })
  findAll(
    @Param('enteId', ParseIntPipe) enteId: number,
    @Query('activo') activo?: string,
  ) {
    const activoOnly = activo !== 'false';
    return this.service.findAllByEnte(enteId, activoOnly);
  }

  @Get(':id')
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({ summary: 'Obtener representante por ID' })
  @ApiResponse({ status: 200, description: 'Representante' })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  findOne(
    @Param('enteId', ParseIntPipe) enteId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.findOneByEnte(enteId, id);
  }

  @Post()
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear representante del ente' })
  @ApiResponse({ status: 201, description: 'Representante creado' })
  create(
    @Param('enteId', ParseIntPipe) enteId: number,
    @Body() dto: CreateRepresentanteDto,
  ) {
    return this.service.create(enteId, dto);
  }

  @Put(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Actualizar representante' })
  @ApiResponse({ status: 200, description: 'Representante actualizado' })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  update(
    @Param('enteId', ParseIntPipe) enteId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRepresentanteDto,
  ) {
    return this.service.update(enteId, id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar representante' })
  @ApiResponse({ status: 204 })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  remove(
    @Param('enteId', ParseIntPipe) enteId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.remove(enteId, id);
  }

  @Post(':id/firma')
  @Roles('ADMIN')
  @UseInterceptors(FileInterceptor('firma'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { firma: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOperation({ summary: 'Subir firma del representante' })
  @ApiResponse({
    status: 200,
    description: 'Representante actualizado con firma',
  })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  async uploadFirma(
    @Param('enteId', ParseIntPipe) enteId: number,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No se envió el archivo de firma');
    return this.service.setFirma(enteId, id, file);
  }
}
