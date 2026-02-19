import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { IAceptacionesRepository } from '@/domain/aceptaciones/ports/aceptaciones.repository.port';
import { AceptarTerminosDto } from '../dto/aceptar-terminos.dto';
import { AceptacionResponseDto } from '../dto/aceptacion-response.dto';
import { Usuario } from '@/entities/usuarios/usuario.entity';

@Injectable()
export class AceptarTerminosUseCase {
  constructor(
    @Inject('IAceptacionesRepository')
    private readonly aceptacionesRepository: IAceptacionesRepository,
  ) {}

  async execute(
    aceptarTerminosDto: AceptarTerminosDto,
    usuario: Usuario,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AceptacionResponseDto[]> {
    // Verificar que todos los documentos existen y están activos
    const documentosActivos =
      await this.aceptacionesRepository.findDocumentosActivos();
    const documentosActivosIds = documentosActivos.map(doc => doc.id);

    // Verificar que todos los IDs proporcionados corresponden a documentos activos
    const documentosInvalidos = aceptarTerminosDto.documentosIds.filter(
      id => !documentosActivosIds.includes(id),
    );

    if (documentosInvalidos.length > 0) {
      throw new BadRequestException(
        `Los siguientes documentos no existen o no están activos: ${documentosInvalidos.join(', ')}`,
      );
    }

    // Verificar que se aceptan todos los documentos activos
    const documentosFaltantes = documentosActivosIds.filter(
      id => !aceptarTerminosDto.documentosIds.includes(id),
    );

    if (documentosFaltantes.length > 0) {
      throw new BadRequestException(
        `Debe aceptar todos los documentos legales activos. Faltan: ${documentosFaltantes.join(', ')}`,
      );
    }

    // Crear aceptaciones para cada documento
    const aceptaciones: AceptacionResponseDto[] = [];

    for (const documentoId of aceptarTerminosDto.documentosIds) {
      // Verificar si ya existe una aceptación para este documento
      const yaAceptado = await this.aceptacionesRepository.hasAceptadoDocumento(
        usuario.id,
        documentoId,
      );

      if (yaAceptado) {
        // Si ya fue aceptado, obtener el documento para la versión
        const documento =
          await this.aceptacionesRepository.findDocumentoById(documentoId);
        if (documento) {
          // Actualizar la aceptación existente (o crear una nueva para la nueva versión)
          // Por ahora, creamos una nueva aceptación para mantener historial
        }
      }

      const documento =
        await this.aceptacionesRepository.findDocumentoById(documentoId);

      if (!documento) {
        throw new NotFoundException(
          `Documento con ID ${documentoId} no encontrado`,
        );
      }

      // Crear nueva aceptación
      const aceptacion = await this.aceptacionesRepository.createAceptacion({
        usuario: usuario,
        documentoLegal: documento,
        version: documento.version,
        ipAddress: ipAddress || undefined,
        userAgent: userAgent || undefined,
      });

      aceptaciones.push({
        id: aceptacion.id,
        documentoLegalId: aceptacion.documentoLegal.id,
        version: aceptacion.version,
        fechaAceptacion: aceptacion.fechaAceptacion,
      });
    }

    return aceptaciones;
  }
}
