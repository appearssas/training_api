import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CreatePagoUseCase } from '@/application/pagos/use-cases/create-pago.use-case';
import { HabilitarConductorUseCase } from '@/application/pagos/use-cases/habilitar-conductor.use-case';
import { CreatePagoDto } from '@/application/pagos/dto/create-pago.dto';
import { PagoResponseDto } from '@/application/pagos/dto/pago-response.dto';
import { GetUser } from '@/infrastructure/shared/auth/decorators/get-user.decorator';
import { Usuario } from '@/entities/usuarios/usuario.entity';
import { RolesGuard, Roles } from '@/infrastructure/shared/guards/roles.guard';

@ApiTags('pagos')
@Controller('pagos')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth('JWT-auth')
export class PagosController {
  constructor(
    private readonly createPagoUseCase: CreatePagoUseCase,
    private readonly habilitarConductorUseCase: HabilitarConductorUseCase,
  ) {}

  @Post()
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar pago manual para conductor externo',
    description: `Registra un pago manual para un conductor externo. Este endpoint permite:
    
- Registrar fecha, valor y método de pago
- Almacenar el pago con trazabilidad (quién lo registró)
- Adjuntar número de comprobante opcional
- Agregar observaciones opcionales

**Nota:** El pago queda almacenado pero el conductor NO se habilita automáticamente. Debe usar el endpoint de habilitación después de registrar el pago.`,
  })
  @ApiBody({ type: CreatePagoDto })
  @ApiResponse({
    status: 201,
    description: 'Pago registrado exitosamente',
    type: PagoResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o el estudiante no es un conductor externo',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado - Se requiere rol de administrador',
  })
  @ApiResponse({
    status: 404,
    description: 'Estudiante no encontrado',
  })
  async createPago(
    @Body() createPagoDto: CreatePagoDto,
    @GetUser() usuario: Usuario,
  ): Promise<PagoResponseDto> {
    return await this.createPagoUseCase.execute(createPagoDto, usuario);
  }

  @Post(':estudianteId/habilitar')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Habilitar conductor externo tras pago',
    description: `Habilita un conductor externo después de que se haya registrado el pago.
    
**Requisitos:**
- El conductor debe ser externo
- Debe existir al menos un pago registrado para el conductor
- El conductor debe tener un usuario asociado

**Resultado:**
- El conductor puede iniciar sesión
- El conductor puede recibir cursos`,
  })
  @ApiParam({
    name: 'estudianteId',
    type: Number,
    description: 'ID del estudiante (conductor externo) a habilitar',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Conductor habilitado exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Conductor Juan Pérez habilitado exitosamente. Ya puede iniciar sesión y recibir cursos.',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'No se puede habilitar: no es conductor externo o no tiene pago registrado',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado - Se requiere rol de administrador',
  })
  @ApiResponse({
    status: 404,
    description: 'Estudiante no encontrado',
  })
  async habilitarConductor(
    @Param('estudianteId', ParseIntPipe) estudianteId: number,
  ): Promise<{ message: string }> {
    return await this.habilitarConductorUseCase.execute(estudianteId);
  }
}

