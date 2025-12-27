import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  HttpCode, 
  HttpStatus, 
  UseGuards,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { DocumentoLegal } from '@/entities/documentos/documento-legal.entity';
import { AceptacionPolitica } from '@/entities/aceptaciones/aceptacion-politica.entity';
import { Usuario } from '@/entities/usuarios/usuario.entity';
import { GetUser } from '@/infrastructure/shared/auth/decorators/get-user.decorator';

interface AceptacionResponse {
  id: number;
  documentoLegalId: number;
  version: string;
  fechaAceptacion: Date;
}

@ApiTags('Términos y Condiciones')
@Controller('terms')
export class TermsController {
  constructor(
    @InjectRepository(DocumentoLegal)
    private readonly documentoLegalRepository: Repository<DocumentoLegal>,
    @InjectRepository(AceptacionPolitica)
    private readonly aceptacionRepository: Repository<AceptacionPolitica>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  @Get('active-documents')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener documentos legales activos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de documentos legales activos',
  })
  async getActiveDocuments() {
    const documentos = await this.documentoLegalRepository.find({
      where: { activo: true },
      order: { fechaCreacion: 'DESC' },
      select: ['id', 'tipo', 'titulo', 'contenido', 'version', 'requiereFirmaDigital', 'activo'],
    });

    // Devolver directamente el array para compatibilidad con el frontend
    return documentos;
  }

  @Get('verify')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar si el usuario ha aceptado todos los términos activos' })
  @ApiResponse({
    status: 200,
    description: 'Estado de aceptación de términos',
  })
  async verifyAcceptance(@GetUser() user: Usuario) {
    // Obtener todos los documentos activos
    const documentosActivos = await this.documentoLegalRepository.find({
      where: { activo: true },
      select: ['id', 'version'],
    });

    if (documentosActivos.length === 0) {
      return {
        aceptado: true,
        message: 'No hay documentos legales activos que aceptar',
      };
    }

    // Obtener las aceptaciones del usuario
    const aceptaciones = await this.aceptacionRepository.find({
      where: { 
        usuario: { id: user.id },
        documentoLegal: { id: In(documentosActivos.map(d => d.id)) }
      },
      relations: ['documentoLegal'],
    });

    // Verificar si ha aceptado todos los documentos activos
    const documentosAceptados = new Set(
      aceptaciones
        .filter(a => a.version === a.documentoLegal.version)
        .map(a => a.documentoLegal.id)
    );

    const todoAceptado = documentosActivos.every(doc => 
      documentosAceptados.has(doc.id)
    );

    if (!todoAceptado) {
      return {
        aceptado: false,
        message: 'Debe aceptar los términos y condiciones antes de continuar',
      };
    }

    return {
      aceptado: true,
      message: 'Todos los términos y condiciones han sido aceptados',
    };
  }

  @Post('accept')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aceptar términos y condiciones' })
  @ApiResponse({
    status: 200,
    description: 'Términos aceptados exitosamente',
  })
  async acceptTerms(
    @GetUser() user: Usuario,
    @Body() body: { documentosIds: number[] }
  ) {
    if (!body.documentosIds || body.documentosIds.length === 0) {
      throw new BadRequestException('Debe proporcionar al menos un documento para aceptar');
    }

    // Obtener los documentos
    const documentos = await this.documentoLegalRepository.find({
      where: { id: In(body.documentosIds) },
    });

    if (documentos.length !== body.documentosIds.length) {
      throw new NotFoundException('Uno o más documentos no existen');
    }

    // Obtener el usuario completo
    const usuario = await this.usuarioRepository.findOne({
      where: { id: user.id },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Crear las aceptaciones
    const aceptaciones: AceptacionResponse[] = [];
    for (const doc of documentos) {
      // Verificar si ya existe una aceptación de esta versión
      const aceptacionExistente = await this.aceptacionRepository.findOne({
        where: {
          usuario: { id: usuario.id },
          documentoLegal: { id: doc.id },
          version: doc.version,
        },
      });

      if (!aceptacionExistente) {
        const aceptacion = new AceptacionPolitica();
        aceptacion.usuario = usuario;
        aceptacion.documentoLegal = doc;
        aceptacion.version = doc.version;
        
        const saved = await this.aceptacionRepository.save(aceptacion);
        aceptaciones.push({
          id: saved.id,
          documentoLegalId: doc.id,
          version: saved.version,
          fechaAceptacion: saved.fechaAceptacion,
        });
      } else {
        aceptaciones.push({
          id: aceptacionExistente.id,
          documentoLegalId: doc.id,
          version: aceptacionExistente.version,
          fechaAceptacion: aceptacionExistente.fechaAceptacion,
        });
      }
    }

    return aceptaciones;
  }
}
