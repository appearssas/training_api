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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles } from '@/infrastructure/shared/guards/roles.guard';
import { EntesCertificadoresService } from './entes-certificadores.service';
import { CreateEnteCertificadorDto, UpdateEnteCertificadorDto } from '@/application/catalogos/dto';

@ApiTags('catalogos')
@Controller('catalogos/entes-certificadores')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth('JWT-auth')
export class EntesCertificadoresController {
  constructor(private readonly service: EntesCertificadoresService) {}

  @Get()
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({ summary: 'Listar entes certificadores', description: 'Catálogo para asignar a capacitaciones. Solo ADMIN puede ver inactivos.' })
  @ApiQuery({ name: 'activo', required: false, type: Boolean, description: 'Si es true, solo activos. ADMIN puede omitir para ver todos.' })
  @ApiResponse({ status: 200, description: 'Lista de entes certificadores' })
  findAll(@Query('activo') activo?: string) {
    const activoOnly = activo !== 'false';
    return this.service.findAll(activoOnly);
  }

  @Get(':id')
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({ summary: 'Obtener un ente certificador por ID' })
  @ApiResponse({ status: 200, description: 'Ente certificador' })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear ente certificador' })
  @ApiResponse({ status: 201, description: 'Ente certificador creado' })
  @ApiResponse({ status: 409, description: 'Código duplicado' })
  create(@Body() dto: CreateEnteCertificadorDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Actualizar ente certificador' })
  @ApiResponse({ status: 200, description: 'Ente certificador actualizado' })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  @ApiResponse({ status: 409, description: 'Código duplicado' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEnteCertificadorDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/logo')
  @Roles('ADMIN')
  @UseInterceptors(FileInterceptor('logo'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { logo: { type: 'string', format: 'binary' } } } })
  @ApiOperation({ summary: 'Subir logo del ente certificador' })
  @ApiResponse({ status: 200, description: 'Ente actualizado con logo' })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  async uploadLogo(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Se requiere el archivo "logo"');
    return this.service.setLogo(id, file);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar ente certificador' })
  @ApiResponse({ status: 204, description: 'Eliminado' })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.service.remove(id);
  }
}
