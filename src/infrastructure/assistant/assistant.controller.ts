import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles } from '@/infrastructure/shared/guards/roles.guard';
import { GetUser } from '@/infrastructure/shared/auth/decorators/get-user.decorator';
import { Usuario } from '@/entities/usuarios/usuario.entity';
import { AssistantService } from './assistant.service';

class ChatRequestDto {
  message: string;
}

class ChatResponseDto {
  reply: string;
}

class QuotaResponseDto {
  tokensAvailable: number | null;
  tokensUsed: number;
  quotaMonthly: number | null;
  message: string;
}

class SetQuotaRequestDto {
  tokenQuotaMonthly: number;
}

@ApiTags('assistant')
@Controller('assistant')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('JWT-auth')
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  @Get('quota')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ver cuota de tokens del asistente',
    description:
      'Devuelve tokens disponibles, usados y un mensaje para mostrar al usuario. Si la empresa tiene cuota asignada, incluye el texto para contactar al administrador si desea más.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cuota y uso actual',
    type: QuotaResponseDto,
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getQuota(@GetUser() user: Usuario): Promise<QuotaResponseDto> {
    return this.assistantService.getQuotaForUser(user);
  }

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Enviar mensaje al asistente',
    description:
      'Envía un mensaje al asistente de Formar 360. El asistente responde con ayuda sobre cómo usar la plataforma, pasos y URLs. Requiere autenticación.',
  })
  @ApiBody({
    type: ChatRequestDto,
    examples: {
      crearCapacitacion: {
        summary: 'Cómo crear una capacitación',
        value: { message: '¿Cómo puedo crear una capacitación?' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description:
      'Respuesta del asistente (texto con posibles enlaces en Markdown)',
    type: ChatResponseDto,
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({
    status: 503,
    description:
      'Asistente no disponible (OPENAI_API_KEY no configurada o error de API)',
  })
  async chat(
    @Body() body: { message: string },
    @GetUser() user: Usuario,
  ): Promise<ChatResponseDto> {
    const reply = await this.assistantService.chat(body.message ?? '', user);
    return { reply };
  }

  @Get('quota/empresas')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[ADMIN] Listar cuotas de tokens por empresa',
    description:
      'Lista todas las empresas activas con su cuota asignada y uso del mes actual.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de empresas con cuota y uso',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          empresaId: { type: 'number' },
          razonSocial: { type: 'string' },
          tokenQuotaMonthly: { type: 'number', nullable: true },
          tokensUsed: { type: 'number' },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Solo ADMIN' })
  async listQuotasEmpresas(): Promise<
    {
      empresaId: number;
      razonSocial: string;
      tokenQuotaMonthly: number | null;
      tokensUsed: number;
    }[]
  > {
    return this.assistantService.listQuotasForAdmin();
  }

  @Put('quota/empresas/:empresaId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[ADMIN] Asignar cuota de tokens a una empresa',
    description:
      'Asigna o actualiza la cuota mensual de tokens del asistente para la empresa. 0 = sin acceso.',
  })
  @ApiParam({ name: 'empresaId', type: Number })
  @ApiBody({ type: SetQuotaRequestDto })
  @ApiResponse({ status: 200, description: 'Cuota actualizada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Solo ADMIN' })
  @ApiResponse({ status: 404, description: 'Empresa no encontrada' })
  async setEmpresaQuota(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Body() body: SetQuotaRequestDto,
  ): Promise<{ message: string }> {
    await this.assistantService.setEmpresaQuota(
      empresaId,
      body.tokenQuotaMonthly,
    );
    return { message: 'Cuota actualizada correctamente.' };
  }
}
