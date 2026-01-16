import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { IDocumentosLegalesRepository } from '@/domain/documentos-legales/ports/documentos-legales.repository.port';
import { DocumentoLegal } from '@/entities/documentos/documento-legal.entity';
import { CreateDocumentoLegalDto } from '@/application/documentos-legales/dto/create-documento-legal.dto';
import { UpdateDocumentoLegalDto } from '@/application/documentos-legales/dto/update-documento-legal.dto';
import { Usuario } from '@/entities/usuarios/usuario.entity';

@Injectable()
export class DocumentosLegalesRepositoryAdapter implements IDocumentosLegalesRepository {
  constructor(
    @InjectRepository(DocumentoLegal)
    private readonly documentoLegalRepository: Repository<DocumentoLegal>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createDto: CreateDocumentoLegalDto,
    creadoPorId: number,
  ): Promise<DocumentoLegal> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const creadoPor = await this.usuarioRepository.findOne({
        where: { id: creadoPorId },
      });

      if (!creadoPor) {
        throw new BadRequestException(
          `Usuario con ID ${creadoPorId} no encontrado`,
        );
      }

      const newDocumento = this.documentoLegalRepository.create({
        tipo: createDto.tipo,
        titulo: createDto.titulo,
        contenido: createDto.contenido,
        version: createDto.version || '1.0',
        requiereFirmaDigital: createDto.requiereFirmaDigital ?? false,
        activo: createDto.activo ?? true,
        creadoPor: creadoPor,
      });

      const savedDocumento = await queryRunner.manager.save(newDocumento);

      await queryRunner.commitTransaction();

      // Cargar relaciones para retornar objeto completo
      return this.documentoLegalRepository.findOne({
        where: { id: savedDocumento.id },
        relations: ['creadoPor'],
      }) as Promise<DocumentoLegal>;
    } catch (error: unknown) {
      await queryRunner.rollbackTransaction();

      if (error instanceof QueryFailedError) {
        throw new BadRequestException((error as QueryFailedError).message);
      }

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Error al crear el documento legal');
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(activo?: boolean): Promise<DocumentoLegal[]> {
    try {
      const where: any = {};
      if (activo !== undefined) {
        where.activo = activo;
      }

      return await this.documentoLegalRepository.find({
        where,
        relations: ['creadoPor'],
        order: { fechaCreacion: 'DESC' },
      });
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        'Error al obtener documentos legales',
      );
    }
  }

  async findOne(id: number): Promise<DocumentoLegal | null> {
    try {
      return await this.documentoLegalRepository.findOne({
        where: { id },
        relations: ['creadoPor'],
      });
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        'Error al obtener el documento legal',
      );
    }
  }

  async findByTipo(tipo: string, activo?: boolean): Promise<DocumentoLegal[]> {
    try {
      const where: any = { tipo };
      if (activo !== undefined) {
        where.activo = activo;
      }

      return await this.documentoLegalRepository.find({
        where,
        relations: ['creadoPor'],
        order: { fechaCreacion: 'DESC' },
      });
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        'Error al obtener documentos legales por tipo',
      );
    }
  }

  async update(
    id: number,
    updateDto: UpdateDocumentoLegalDto,
  ): Promise<DocumentoLegal> {
    try {
      const documento = await this.documentoLegalRepository.findOne({
        where: { id },
      });

      if (!documento) {
        throw new NotFoundException(
          `Documento legal con ID ${id} no encontrado`,
        );
      }

      Object.assign(documento, updateDto);

      await this.documentoLegalRepository.save(documento);

      // Retornar documento actualizado con relaciones
      return this.documentoLegalRepository.findOne({
        where: { id },
        relations: ['creadoPor'],
      }) as Promise<DocumentoLegal>;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(error);
      throw new InternalServerErrorException(
        'Error al actualizar el documento legal',
      );
    }
  }

  async remove(id: number): Promise<void> {
    try {
      const documento = await this.documentoLegalRepository.findOne({
        where: { id },
      });

      if (!documento) {
        throw new NotFoundException(
          `Documento legal con ID ${id} no encontrado`,
        );
      }

      // Soft delete: desactivar en lugar de eliminar
      documento.activo = false;
      await this.documentoLegalRepository.save(documento);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(error);
      throw new InternalServerErrorException(
        'Error al eliminar el documento legal',
      );
    }
  }
}
