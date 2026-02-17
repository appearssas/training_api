import {
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles } from '@/infrastructure/shared/guards/roles.guard';
import { InstructoresCatalogosService } from './instructores-catalogos.service';

@ApiTags('catalogos')
@Controller('catalogos/instructores')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth('JWT-auth')
export class InstructoresCatalogosController {
  constructor(private readonly service: InstructoresCatalogosService) {}

  @Get()
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({ summary: 'Listar instructores (docentes)' })
  @ApiResponse({ status: 200, description: 'Lista de instructores con persona' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({ summary: 'Obtener instructor por ID' })
  @ApiResponse({ status: 200, description: 'Instructor' })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post(':id/firma')
  @Roles('ADMIN')
  @UseInterceptors(FileInterceptor('firma'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { firma: { type: 'string', format: 'binary' } } } })
  @ApiOperation({ summary: 'Subir firma del instructor' })
  @ApiResponse({ status: 200, description: 'Instructor actualizado con firma' })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  async uploadFirma(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Se requiere el archivo "firma"');
    return this.service.setFirma(id, file);
  }
}
