import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { ICertificadosRepository } from '@/domain/certificados/ports/certificados.repository.port';
import { Certificado } from '@/entities/certificados/certificado.entity';
import { Inscripcion } from '@/entities/inscripcion/inscripcion.entity';
import { CreateCertificadoDto } from '@/application/certificados/dto/create-certificado.dto';
import { UpdateCertificadoDto } from '@/application/certificados/dto/update-certificado.dto';
import { PaginationDto } from '@/application/shared/dto/pagination.dto';

/**
 * Adaptador del repositorio de Certificados
 * Implementa el puerto ICertificadosRepository usando TypeORM
 * Sigue principios SOLID: Dependency Inversion
 */
@Injectable()
export class CertificadosRepositoryAdapter implements ICertificadosRepository {
  constructor(
    @InjectRepository(Certificado)
    private readonly certificadoRepository: Repository<Certificado>,
    @InjectRepository(Inscripcion)
    private readonly inscripcionRepository: Repository<Inscripcion>,
  ) {}

  async create(
    createCertificadoDto: CreateCertificadoDto,
  ): Promise<Certificado> {
    try {
      // Verificar que la inscripción existe
      const inscripcion = await this.inscripcionRepository.findOne({
        where: { id: createCertificadoDto.inscripcionId },
      });

      if (!inscripcion) {
        throw new NotFoundException(
          `Inscripción con ID ${createCertificadoDto.inscripcionId} no encontrada`,
        );
      }

      const newCertificado = new Certificado();
      newCertificado.inscripcion = inscripcion;
      newCertificado.numeroCertificado = `CERT-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      newCertificado.fechaAprobacionReal = new Date();
      newCertificado.fechaRetroactiva = createCertificadoDto.fechaRetroactiva
        ? new Date(createCertificadoDto.fechaRetroactiva)
        : null;
      newCertificado.esRetroactivo =
        createCertificadoDto.esRetroactivo ?? false;
      newCertificado.justificacionRetroactiva =
        createCertificadoDto.justificacionRetroactiva || null;
      newCertificado.activo = true;

      const saved = await this.certificadoRepository.save(newCertificado);
      return saved;
    } catch (error: unknown) {
      if (error instanceof QueryFailedError) {
        throw new BadRequestException((error as QueryFailedError).message);
      }
      console.error(error);
      throw new InternalServerErrorException('Error al crear el certificado');
    }
  }

  async findAll(pagination: PaginationDto): Promise<any> {
    try {
      const { page = 1, limit = 10, search, sortField, sortOrder } = pagination;
      const skip = (page - 1) * limit;

      const queryBuilder = this.certificadoRepository
        .createQueryBuilder('certificado')
        .leftJoinAndSelect('certificado.inscripcion', 'inscripcion')
        .leftJoinAndSelect('inscripcion.estudiante', 'estudiante')
        .leftJoinAndSelect('inscripcion.capacitacion', 'capacitacion');

      if (search) {
        queryBuilder.where(
          '(certificado.numeroCertificado LIKE :search OR estudiante.nombres LIKE :search OR estudiante.apellidos LIKE :search OR capacitacion.titulo LIKE :search)',
          { search: `%${search}%` },
        );
      }

      if (sortField) {
        queryBuilder.orderBy(`certificado.${sortField}`, sortOrder || 'ASC');
      } else {
        queryBuilder.orderBy('certificado.fechaEmision', 'DESC');
      }

      queryBuilder.skip(skip).take(limit);

      const [data, total] = await queryBuilder.getManyAndCount();

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error: unknown) {
      console.error(error);
      throw new InternalServerErrorException(
        'Error al obtener los certificados',
      );
    }
  }

  async findOne(id: number): Promise<Certificado | null> {
    try {
      return await this.certificadoRepository.findOne({
        where: { id },
        relations: [
          'inscripcion',
          'inscripcion.estudiante',
          'inscripcion.capacitacion',
          'inscripcion.capacitacion.instructor',
        ],
      });
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Error al obtener el certificado');
    }
  }

  async findByInscripcion(inscripcionId: number): Promise<Certificado[]> {
    try {
      return await this.certificadoRepository.find({
        where: { inscripcion: { id: inscripcionId } },
        relations: [
          'inscripcion',
          'inscripcion.estudiante',
          'inscripcion.capacitacion',
        ],
        order: { fechaEmision: 'DESC' },
      });
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        'Error al obtener los certificados de la inscripción',
      );
    }
  }

  async findByHashVerificacion(hash: string): Promise<Certificado | null> {
    try {
      return await this.certificadoRepository.findOne({
        where: { hashVerificacion: hash },
        relations: [
          'inscripcion',
          'inscripcion.estudiante',
          'inscripcion.capacitacion',
          'inscripcion.capacitacion.instructor',
        ],
      });
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        'Error al verificar el certificado',
      );
    }
  }

  async update(
    id: number,
    updateCertificadoDto: UpdateCertificadoDto,
  ): Promise<Certificado> {
    try {
      const certificado = await this.certificadoRepository.findOne({
        where: { id },
      });

      if (!certificado) {
        throw new NotFoundException(`Certificado con ID ${id} no encontrado`);
      }

      const updatedCertificado = {
        ...certificado,
        ...updateCertificadoDto,
        fechaRetroactiva: updateCertificadoDto.fechaRetroactiva
          ? new Date(updateCertificadoDto.fechaRetroactiva)
          : certificado.fechaRetroactiva,
      };

      return await this.certificadoRepository.save(updatedCertificado);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(error);
      throw new InternalServerErrorException(
        'Error al actualizar el certificado',
      );
    }
  }

  async remove(id: number): Promise<void> {
    try {
      const certificado = await this.certificadoRepository.findOne({
        where: { id },
      });

      if (!certificado) {
        throw new NotFoundException(`Certificado con ID ${id} no encontrado`);
      }

      await this.certificadoRepository.remove(certificado);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(error);
      throw new InternalServerErrorException(
        'Error al eliminar el certificado',
      );
    }
  }
}
