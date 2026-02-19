import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Request,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/infrastructure/shared/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@/infrastructure/shared/guards/roles.guard';
import { ConfiguracionSesion } from '@/entities/sesion/configuracion-sesion.entity';
import {
  CreateConfiguracionSesionDto,
  UpdateConfiguracionSesionDto,
  ConfiguracionSesionResponseDto,
} from '@/application/sesion/dto';
import { GetActiveConfiguracionSesionUseCase } from '@/application/sesion/use-cases/get-active-configuracion-sesion.use-case';
import { CreateConfiguracionSesionUseCase } from '@/application/sesion/use-cases/create-configuracion-sesion.use-case';
import { UpdateConfiguracionSesionUseCase } from '@/application/sesion/use-cases/update-configuracion-sesion.use-case';
import { Public } from '@/infrastructure/shared/auth/decorators/public.decorator';

@ApiTags('configuracion-sesion')
@Controller('configuracion-sesion')
@UseGuards(JwtAuthGuard)
export class ConfiguracionSesionController {
  constructor(
    private readonly getActiveConfiguracionSesionUseCase: GetActiveConfiguracionSesionUseCase,
    private readonly createConfiguracionSesionUseCase: CreateConfiguracionSesionUseCase,
    private readonly updateConfiguracionSesionUseCase: UpdateConfiguracionSesionUseCase,
  ) {}

  @Get('active')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener configuración activa de sesión',
    description:
      'Obtiene la configuración activa de sesión. Endpoint público para que el frontend pueda obtener la configuración sin autenticación.',
  })
  @ApiResponse({
    status: 200,
    description: 'Configuración activa de sesión',
    type: ConfiguracionSesionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'No hay configuración activa',
  })
  async getActive(): Promise<ConfiguracionSesion | null> {
    return this.getActiveConfiguracionSesionUseCase.execute();
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear configuración de sesión',
    description:
      'Crea una nueva configuración de sesión. Solo disponible para ADMIN.',
  })
  @ApiBody({ type: CreateConfiguracionSesionDto })
  @ApiResponse({
    status: 201,
    description: 'Configuración creada exitosamente',
    type: ConfiguracionSesionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado - Se requiere rol de administrador (ADMIN)',
  })
  async create(
    @Body() createDto: CreateConfiguracionSesionDto,
    @Request() req: { user?: { id: number } },
  ): Promise<ConfiguracionSesion> {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }
    return this.createConfiguracionSesionUseCase.execute(createDto, userId);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar configuración de sesión',
    description:
      'Actualiza una configuración de sesión existente. Solo disponible para ADMIN.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID de la configuración',
  })
  @ApiBody({ type: UpdateConfiguracionSesionDto })
  @ApiResponse({
    status: 200,
    description: 'Configuración actualizada exitosamente',
    type: ConfiguracionSesionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado - Se requiere rol de administrador (ADMIN)',
  })
  @ApiResponse({
    status: 404,
    description: 'Configuración no encontrada',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateConfiguracionSesionDto,
  ): Promise<ConfiguracionSesion> {
    return this.updateConfiguracionSesionUseCase.execute(id, updateDto);
  }
}
