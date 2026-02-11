import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import {
  ICertificadosRepository,
  CertificadosUserContext,
} from '@/domain/certificados/ports/certificados.repository.port';
import { Certificado } from '@/entities/certificados/certificado.entity';
import { Inscripcion } from '@/entities/inscripcion/inscripcion.entity';
import { CreateCertificadoDto } from '@/application/certificados/dto/create-certificado.dto';
import { UpdateCertificadoDto } from '@/application/certificados/dto/update-certificado.dto';
import { PaginationDto } from '@/application/shared/dto/pagination.dto';

/**
 * Parsea una cadena de solo fecha (YYYY-MM-DD) como mediodía UTC para que el día
 * calendario se conserve al guardar/leer en cualquier zona (ej. America/Bogota).
 * Evita que "2027-02-06" se guarde como 2027-02-05 por conversión a local.
 */
function parseDateOnly(dateStr: string): Date {
  const trimmed = dateStr?.trim() ?? '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return new Date(trimmed + 'T12:00:00.000Z');
  }
  return new Date(dateStr);
}

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
      // Log para debugging: verificar qué inscripcionId se recibe en el repositorio
      console.log(
        '🔍 CertificadosRepositoryAdapter.create - inscripcionId recibido:',
        createCertificadoDto.inscripcionId,
      );

      // CORRECCIÓN: Cargar inscripción con todas las relaciones necesarias
      // Esto asegura que el certificado tenga acceso a los datos correctos de la capacitación
      // IMPORTANTE: Usar QueryBuilder para evitar problemas de caché de TypeORM
      const inscripcion = await this.inscripcionRepository
        .createQueryBuilder('inscripcion')
        .where('inscripcion.id = :id', {
          id: createCertificadoDto.inscripcionId,
        })
        .leftJoinAndSelect('inscripcion.estudiante', 'estudiante')
        .leftJoinAndSelect('inscripcion.capacitacion', 'capacitacion')
        .leftJoinAndSelect('capacitacion.instructor', 'instructor')
        .leftJoinAndSelect('capacitacion.tipoCapacitacion', 'tipoCapacitacion')
        .getOne();

      // Log para verificar qué inscripción se cargó
      console.log(
        '🔍 CertificadosRepositoryAdapter.create - inscripción cargada:',
        {
          id: inscripcion?.id,
          capacitacionId: inscripcion?.capacitacion?.id,
          capacitacionTitulo: inscripcion?.capacitacion?.titulo,
        },
      );

      if (!inscripcion) {
        throw new NotFoundException(
          `Inscripción con ID ${createCertificadoDto.inscripcionId} no encontrada`,
        );
      }

      // Validar que la capacitación esté cargada
      if (!inscripcion.capacitacion) {
        throw new BadRequestException(
          `La inscripción ${createCertificadoDto.inscripcionId} no tiene una capacitación asociada`,
        );
      }

      // Calcular fecha de emisión (puede ser retroactiva). Usar parseDateOnly para evitar desfase por zona horaria (Bogotá).
      const fechaEmision =
        createCertificadoDto.esRetroactivo &&
        createCertificadoDto.fechaRetroactiva
          ? parseDateOnly(createCertificadoDto.fechaRetroactiva)
          : new Date();

      // Calcular fecha de vencimiento: 1 año después de la fecha de emisión
      const fechaVencimiento = new Date(fechaEmision);
      fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + 1);

      const newCertificado = new Certificado();
      newCertificado.inscripcion = inscripcion;
      newCertificado.numeroCertificado = `CERT-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      newCertificado.fechaAprobacionReal = new Date();
      newCertificado.fechaRetroactiva = createCertificadoDto.fechaRetroactiva
        ? parseDateOnly(createCertificadoDto.fechaRetroactiva)
        : null;
      newCertificado.esRetroactivo =
        createCertificadoDto.esRetroactivo ?? false;
      newCertificado.justificacionRetroactiva =
        createCertificadoDto.justificacionRetroactiva || null;
      newCertificado.fechaVencimiento = fechaVencimiento;
      newCertificado.hashVerificacion =
        (createCertificadoDto as any).hashVerificacion || null;
      newCertificado.codigoQr = (createCertificadoDto as any).codigoQr || null;
      newCertificado.urlVerificacionPublica =
        (createCertificadoDto as any).urlVerificacionPublica || null;
      newCertificado.activo = true;

      // Log para debugging: verificar datos antes de guardar
      console.log('📝 Creando certificado con datos:', {
        inscripcionId: inscripcion.id,
        capacitacionId: inscripcion.capacitacion?.id,
        capacitacionTitulo: inscripcion.capacitacion?.titulo,
        fechaEmision: fechaEmision.toISOString(),
        fechaVencimiento: fechaVencimiento.toISOString(),
        hashVerificacion: newCertificado.hashVerificacion
          ? 'presente'
          : 'ausente',
        codigoQr: newCertificado.codigoQr ? 'presente' : 'ausente',
        urlVerificacionPublica:
          newCertificado.urlVerificacionPublica || 'ausente',
      });

      const saved = await this.certificadoRepository.save(newCertificado);

      // CORRECCIÓN CRÍTICA: Recargar el certificado con todas las relaciones usando QueryBuilder
      // y luego asignar manualmente la inscripción cargada para evitar problemas de caché de TypeORM
      const certificadoConRelaciones = await this.certificadoRepository
        .createQueryBuilder('certificado')
        .leftJoinAndSelect('certificado.inscripcion', 'inscripcion')
        .leftJoinAndSelect('inscripcion.estudiante', 'estudiante')
        .leftJoinAndSelect('inscripcion.capacitacion', 'capacitacion')
        .leftJoinAndSelect('capacitacion.instructor', 'instructor')
        .leftJoinAndSelect('capacitacion.tipoCapacitacion', 'tipoCapacitacion')
        .where('certificado.id = :id', { id: saved.id })
        .getOne();

      // IMPORTANTE: Asignar directamente la inscripción cargada previamente con todas sus relaciones
      // Esto asegura que se use la capacitación correcta y evita problemas de caché de TypeORM
      if (certificadoConRelaciones) {
        certificadoConRelaciones.inscripcion = inscripcion;
      }

      // Log para verificar que la capacitación se cargó correctamente
      if (certificadoConRelaciones) {
        console.log('✅ Certificado recargado con relaciones:', {
          certificadoId: certificadoConRelaciones.id,
          capacitacionId:
            certificadoConRelaciones.inscripcion?.capacitacion?.id,
          capacitacionTitulo:
            certificadoConRelaciones.inscripcion?.capacitacion?.titulo,
          hashVerificacion:
            certificadoConRelaciones.hashVerificacion || 'ausente',
          codigoQr: certificadoConRelaciones.codigoQr ? 'presente' : 'ausente',
          urlVerificacionPublica:
            certificadoConRelaciones.urlVerificacionPublica || 'ausente',
        });
      }

      return certificadoConRelaciones || saved;
    } catch (error: unknown) {
      if (error instanceof QueryFailedError) {
        throw new BadRequestException((error as QueryFailedError).message);
      }
      console.error(error);
      throw new InternalServerErrorException('Error al crear el certificado');
    }
  }

  async findAll(
    pagination: PaginationDto,
    userContext?: CertificadosUserContext,
  ): Promise<any> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        sortField,
        sortOrder,
        filters,
      } = pagination;
      const skip = (page - 1) * limit;

      // IMPORTANTE: Usar QueryBuilder con leftJoinAndSelect para forzar la carga de relaciones
      // y evitar problemas de caché de TypeORM
      const queryBuilder = this.certificadoRepository
        .createQueryBuilder('certificado')
        .leftJoinAndSelect('certificado.inscripcion', 'inscripcion')
        .leftJoinAndSelect('inscripcion.estudiante', 'estudiante')
        .leftJoinAndSelect('inscripcion.capacitacion', 'capacitacion')
        .leftJoinAndSelect('capacitacion.instructor', 'instructor')
        .leftJoinAndSelect('capacitacion.tipoCapacitacion', 'tipoCapacitacion');

      // Control de visibilidad por rol: ADMIN ve todos; INSTRUCTOR solo sus cursos; ALUMNO solo los propios; CLIENTE/OPERADOR por empresa
      const rol = userContext?.rol ?? '';
      const personaId = userContext?.personaId ?? null;
      const empresaId = userContext?.empresaId ?? null;
      if (rol !== 'ADMIN' && personaId != null) {
        if (rol === 'INSTRUCTOR') {
          queryBuilder.andWhere('instructor.id = :personaId', { personaId });
          console.log(
            `🔐 [findAll] Filtro INSTRUCTOR: instructor.id = ${personaId}`,
          );
        } else if (
          (rol === 'CLIENTE' || rol === 'OPERADOR') &&
          empresaId != null
        ) {
          // Certificados de conductores/estudiantes de su empresa
          queryBuilder.andWhere('estudiante.empresaId = :empresaId', {
            empresaId,
          });
          console.log(
            `🔐 [findAll] Filtro ${rol}: estudiante.empresaId = ${empresaId}`,
          );
        } else {
          // ALUMNO o CLIENTE/OPERADOR sin empresa: solo certificados donde el usuario es el estudiante
          queryBuilder.andWhere('estudiante.id = :personaId', { personaId });
          console.log(
            `🔐 [findAll] Filtro ${rol}: estudiante.id = ${personaId}`,
          );
        }
      } else if (rol !== 'ADMIN' && personaId == null) {
        queryBuilder.andWhere('1 = 0');
        console.log(`🔐 [findAll] Rol ${rol} sin personaId: sin resultados.`);
      } else {
        console.log(`🔐 [findAll] ADMIN: sin filtro por usuario.`);
      }

      // Filtro por estudiante (studentId)
      if (filters?.studentId) {
        const studentId = parseInt(String(filters.studentId), 10);
        if (!isNaN(studentId)) {
          queryBuilder.andWhere('estudiante.id = :studentId', { studentId });
          console.log(`🔍 Filtrado por estudiante ID: ${studentId}`);
        }
      }

      // Filtro por curso (courseId)
      if (filters?.courseId) {
        const courseId = parseInt(String(filters.courseId), 10);
        if (!isNaN(courseId)) {
          queryBuilder.andWhere('capacitacion.id = :courseId', { courseId });
          console.log(`🔍 Filtrado por curso ID: ${courseId}`);
        }
      }

      // Filtro por estado (status): normalizar a minúsculas por si llega con otro formato
      const status = filters?.status
        ? String(filters.status).toLowerCase().trim()
        : '';
      if (status) {
        if (status === 'valid') {
          queryBuilder.andWhere('certificado.activo = :activo', {
            activo: true,
          });
          queryBuilder.andWhere(
            '(certificado.fechaVencimiento IS NULL OR certificado.fechaVencimiento > :now)',
            { now: new Date() },
          );
        } else if (status === 'expired') {
          // Vencidos: fechaVencimiento no nula y ya pasada (usar fecha de hoy para evitar zonas horarias)
          const hoy = new Date();
          hoy.setHours(23, 59, 59, 999);
          queryBuilder.andWhere('certificado.fechaVencimiento IS NOT NULL');
          queryBuilder.andWhere('certificado.fechaVencimiento <= :hoy', {
            hoy,
          });
        } else if (status === 'revoked') {
          queryBuilder.andWhere('certificado.activo = :activo', {
            activo: false,
          });
        }
        console.log(`🔍 Filtrado por estado: ${status}`);
      }

      // Filtro de búsqueda general
      if (search) {
        queryBuilder.andWhere(
          '(certificado.numeroCertificado LIKE :search OR estudiante.nombres LIKE :search OR estudiante.apellidos LIKE :search OR capacitacion.titulo LIKE :search)',
          { search: `%${search}%` },
        );
        console.log(`🔍 Búsqueda: ${search}`);
      }

      if (sortField) {
        queryBuilder.orderBy(`certificado.${sortField}`, sortOrder || 'ASC');
      } else {
        queryBuilder.orderBy('certificado.fechaEmision', 'DESC');
      }

      queryBuilder.skip(skip).take(limit);

      const [data, total] = await queryBuilder.getManyAndCount();

      // Log para verificar que cada certificado tiene la capacitación correcta
      if (data.length > 0) {
        console.log('📋 Certificados cargados con relaciones:');
        data.forEach((cert, index) => {
          console.log(`  Certificado ${index + 1}:`, {
            certificadoId: cert.id,
            inscripcionId: cert.inscripcion?.id,
            capacitacionId: cert.inscripcion?.capacitacion?.id,
            capacitacionTitulo:
              cert.inscripcion?.capacitacion?.titulo || 'NO DISPONIBLE',
          });
        });
      }

      console.log(
        `✅ Certificados encontrados: ${total} (página ${page}, límite ${limit})`,
      );

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error: unknown) {
      console.error('❌ Error en findAll certificados:', error);
      throw new InternalServerErrorException(
        'Error al obtener los certificados',
      );
    }
  }

  async findOne(id: number): Promise<Certificado | null> {
    try {
      // IMPORTANTE: Usar QueryBuilder para evitar problemas de caché de TypeORM
      // y asegurar que se carguen todas las relaciones correctamente
      const certificado = await this.certificadoRepository
        .createQueryBuilder('certificado')
        .leftJoinAndSelect('certificado.inscripcion', 'inscripcion')
        .leftJoinAndSelect('inscripcion.estudiante', 'estudiante')
        .leftJoinAndSelect('inscripcion.capacitacion', 'capacitacion')
        .leftJoinAndSelect('capacitacion.instructor', 'instructor')
        .leftJoinAndSelect('capacitacion.tipoCapacitacion', 'tipoCapacitacion')
        .where('certificado.id = :id', { id })
        .getOne();

      // Log para verificar que la capacitación se cargó correctamente
      if (certificado) {
        console.log('📋 Certificado cargado con relaciones:', {
          certificadoId: certificado.id,
          inscripcionId: certificado.inscripcion?.id,
          capacitacionId: certificado.inscripcion?.capacitacion?.id,
          capacitacionTitulo:
            certificado.inscripcion?.capacitacion?.titulo || 'NO DISPONIBLE',
        });
      }

      return certificado;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Error al obtener el certificado');
    }
  }

  async findByInscripcion(inscripcionId: number): Promise<Certificado[]> {
    try {
      // IMPORTANTE: Usar QueryBuilder para evitar problemas de caché de TypeORM
      const certificados = await this.certificadoRepository
        .createQueryBuilder('certificado')
        .leftJoinAndSelect('certificado.inscripcion', 'inscripcion')
        .leftJoinAndSelect('inscripcion.estudiante', 'estudiante')
        .leftJoinAndSelect('inscripcion.capacitacion', 'capacitacion')
        .leftJoinAndSelect('capacitacion.instructor', 'instructor')
        .leftJoinAndSelect('capacitacion.tipoCapacitacion', 'tipoCapacitacion')
        .where('inscripcion.id = :inscripcionId', { inscripcionId })
        .orderBy('certificado.fechaEmision', 'DESC')
        .getMany();

      return certificados;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        'Error al obtener los certificados de la inscripción',
      );
    }
  }

  async searchForEditor(
    search: string,
    limit: number = 20,
  ): Promise<
    Array<{
      id: number;
      hashVerificacion: string;
      numeroCertificado: string;
      estudianteNombre: string;
      cursoNombre: string;
      fechaEmision: Date;
    }>
  > {
    try {
      const queryBuilder = this.certificadoRepository
        .createQueryBuilder('certificado')
        .leftJoinAndSelect('certificado.inscripcion', 'inscripcion')
        .leftJoinAndSelect('inscripcion.estudiante', 'estudiante')
        .leftJoinAndSelect('inscripcion.capacitacion', 'capacitacion')
        .where('certificado.activo = :activo', { activo: true })
        .andWhere('certificado.hashVerificacion IS NOT NULL');

      if (search) {
        queryBuilder.andWhere(
          '(certificado.hashVerificacion LIKE :search OR certificado.numeroCertificado LIKE :search OR estudiante.nombres LIKE :search OR estudiante.apellidos LIKE :search OR capacitacion.titulo LIKE :search)',
          { search: `%${search}%` },
        );
      }

      queryBuilder.orderBy('certificado.fechaEmision', 'DESC').take(limit);

      const certificados = await queryBuilder.getMany();

      return certificados.map(cert => ({
        id: cert.id,
        hashVerificacion: cert.hashVerificacion || '',
        numeroCertificado: cert.numeroCertificado,
        estudianteNombre: cert.inscripcion?.estudiante
          ? `${cert.inscripcion.estudiante.nombres || ''} ${cert.inscripcion.estudiante.apellidos || ''}`.trim()
          : 'N/A',
        cursoNombre: cert.inscripcion?.capacitacion?.titulo || 'N/A',
        fechaEmision: cert.fechaEmision,
      }));
    } catch (error: unknown) {
      console.error('❌ Error en searchForEditor:', error);
      throw new InternalServerErrorException(
        'Error al buscar certificados para el editor',
      );
    }
  }

  async findByEstudiante(
    estudianteId: number,
    pagination?: PaginationDto,
    userContext?: CertificadosUserContext,
  ): Promise<any> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        sortField,
        sortOrder,
      } = pagination || {};
      const skip = (page - 1) * limit;

      const queryBuilder = this.certificadoRepository
        .createQueryBuilder('certificado')
        .leftJoinAndSelect('certificado.inscripcion', 'inscripcion')
        .leftJoinAndSelect('inscripcion.estudiante', 'estudiante')
        .leftJoinAndSelect('inscripcion.capacitacion', 'capacitacion')
        .where('inscripcion.estudiante_id = :estudianteId', { estudianteId })
        .andWhere('certificado.activo = :activo', { activo: true });

      // CLIENTE/OPERADOR: solo certificados de estudiantes de su empresa
      const rol = userContext?.rol ?? '';
      const empresaId = userContext?.empresaId ?? null;
      if ((rol === 'CLIENTE' || rol === 'OPERADOR') && empresaId != null) {
        queryBuilder.andWhere('estudiante.empresaId = :empresaId', {
          empresaId,
        });
      }

      // Búsqueda por texto
      if (search) {
        queryBuilder.andWhere(
          '(certificado.numeroCertificado LIKE :search OR capacitacion.titulo LIKE :search)',
          { search: `%${search}%` },
        );
      }

      // Ordenamiento
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
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        'Error al obtener los certificados del estudiante',
      );
    }
  }

  async findByHashVerificacion(hash: string): Promise<Certificado | null> {
    try {
      // Una sola query con todas las relaciones necesarias para el PDF (optimizado para descarga)
      const certificado = await this.certificadoRepository
        .createQueryBuilder('certificado')
        .leftJoinAndSelect('certificado.inscripcion', 'inscripcion')
        .leftJoinAndSelect('inscripcion.estudiante', 'estudiante')
        .leftJoinAndSelect('inscripcion.capacitacion', 'capacitacion')
        .leftJoinAndSelect('capacitacion.instructor', 'instructor')
        .leftJoinAndSelect('capacitacion.tipoCapacitacion', 'tipoCapacitacion')
        .where('certificado.hashVerificacion = :hash', { hash })
        .getOne();

      return certificado ?? null;
    } catch (error) {
      console.error('[Repository] Error en findByHashVerificacion:', error);
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

      const updatedCertificado = { ...certificado };

      if (updateCertificadoDto.fechaEmision !== undefined) {
        updatedCertificado.fechaEmision = parseDateOnly(
          updateCertificadoDto.fechaEmision,
        );
      }
      if (updateCertificadoDto.fechaVencimiento !== undefined) {
        updatedCertificado.fechaVencimiento = parseDateOnly(
          updateCertificadoDto.fechaVencimiento,
        );
      }
      if (updateCertificadoDto.fechaRetroactiva !== undefined) {
        updatedCertificado.fechaRetroactiva =
          updateCertificadoDto.fechaRetroactiva
            ? parseDateOnly(updateCertificadoDto.fechaRetroactiva)
            : null;
      }
      if (updateCertificadoDto.esRetroactivo !== undefined) {
        updatedCertificado.esRetroactivo = updateCertificadoDto.esRetroactivo;
      }
      if (updateCertificadoDto.justificacionRetroactiva !== undefined) {
        updatedCertificado.justificacionRetroactiva =
          updateCertificadoDto.justificacionRetroactiva ?? null;
      }
      if (updateCertificadoDto.emitidoPor !== undefined) {
        (updatedCertificado as any).emitidoPor =
          updateCertificadoDto.emitidoPor;
      }
      if (updateCertificadoDto.urlCertificado !== undefined) {
        updatedCertificado.urlCertificado = updateCertificadoDto.urlCertificado;
      }

      await this.certificadoRepository.save(updatedCertificado);

      // IMPORTANTE: Recargar el certificado con todas las relaciones usando QueryBuilder
      const certificadoRecargado = await this.certificadoRepository
        .createQueryBuilder('certificado')
        .leftJoinAndSelect('certificado.inscripcion', 'inscripcion')
        .leftJoinAndSelect('inscripcion.estudiante', 'estudiante')
        .leftJoinAndSelect('inscripcion.capacitacion', 'capacitacion')
        .leftJoinAndSelect('capacitacion.instructor', 'instructor')
        .leftJoinAndSelect('capacitacion.tipoCapacitacion', 'tipoCapacitacion')
        .where('certificado.id = :id', { id })
        .getOne();

      return certificadoRecargado || (updatedCertificado as Certificado);
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
