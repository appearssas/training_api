import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, MoreThan, LessThan } from 'typeorm';
import { Certificado } from '@/entities/certificados/certificado.entity';
import {
  GetExpiringCertificatesDto,
  CertificateExpirationStatus,
} from '../dto/get-expiring-certificates.dto';
import { CertificateVigencyHelper } from '../helpers/certificate-vigency.helper';

export interface CertificadoConDias extends Certificado {
  diasRestantes: number;
}

export interface ExpiringCertificatesReport {
  certificados: CertificadoConDias[];
  total: number;
  pagina: number;
  totalPaginas: number;
}

@Injectable()
export class GetExpiringCertificatesReportUseCase {
  constructor(
    @InjectRepository(Certificado)
    private readonly certificadoRepository: Repository<Certificado>,
    private readonly vigencyHelper: CertificateVigencyHelper,
  ) {}

  async execute(
    dto: GetExpiringCertificatesDto,
  ): Promise<ExpiringCertificatesReport> {
    const { pagina = 1, limite = 10, busqueda, estado } = dto;
    const skip = (pagina - 1) * limite;

    // Construir condiciones de búsqueda
    const where: any = {
      fechaVencimiento: { ...{} }, // Forzar que tenga fecha de vencimiento
      activo: true,
    };

    // Filtrar por rango de fechas si se proporcionan
    if (dto.fechaVencimientoDesde && dto.fechaVencimientoHasta) {
      where.fechaVencimiento = Between(
        new Date(dto.fechaVencimientoDesde),
        new Date(dto.fechaVencimientoHasta),
      );
    } else if (dto.fechaVencimientoDesde) {
      where.fechaVencimiento = MoreThan(new Date(dto.fechaVencimientoDesde));
    } else if (dto.fechaVencimientoHasta) {
      where.fechaVencimiento = LessThan(new Date(dto.fechaVencimientoHasta));
    }

    // Construir query
    let query = this.certificadoRepository
      .createQueryBuilder('certificado')
      .leftJoinAndSelect('certificado.inscripcion', 'inscripcion')
      .leftJoinAndSelect('inscripcion.alumno', 'alumno')
      .leftJoinAndSelect('alumno.persona', 'persona')
      .leftJoinAndSelect('inscripcion.capacitacion', 'capacitacion')
      .where('certificado.activo = :activo', { activo: true })
      .andWhere('certificado.fechaVencimiento IS NOT NULL');

    // Aplicar filtros de búsqueda
    if (busqueda) {
      query = query.andWhere(
        '(persona.nombres LIKE :busqueda OR persona.apellidos LIKE :busqueda OR capacitacion.titulo LIKE :busqueda OR certificado.numeroCertificado LIKE :busqueda)',
        { busqueda: `%${busqueda}%` },
      );
    }

    // Aplicar filtros de fecha
    if (dto.fechaVencimientoDesde && dto.fechaVencimientoHasta) {
      query = query.andWhere(
        'certificado.fechaVencimiento BETWEEN :desde AND :hasta',
        {
          desde: dto.fechaVencimientoDesde,
          hasta: dto.fechaVencimientoHasta,
        },
      );
    } else if (dto.fechaVencimientoDesde) {
      query = query.andWhere('certificado.fechaVencimiento >= :desde', {
        desde: dto.fechaVencimientoDesde,
      });
    } else if (dto.fechaVencimientoHasta) {
      query = query.andWhere('certificado.fechaVencimiento <= :hasta', {
        hasta: dto.fechaVencimientoHasta,
      });
    }

    // Obtener resultados
    const [certificados, total] = await query
      .orderBy('certificado.fechaVencimiento', 'ASC')
      .skip(skip)
      .take(limite)
      .getManyAndCount();

    // Calcular días restantes y filtrar por estado si es necesario
    let certificadosConDias: CertificadoConDias[] = certificados.map(
      (cert) => ({
        ...cert,
        diasRestantes:
          this.vigencyHelper.calculateDaysUntilExpiration(
            cert.fechaVencimiento,
          ),
      }),
    );

    // Filtrar por estado
    if (estado) {
      certificadosConDias = certificadosConDias.filter((cert) => {
        if (estado === CertificateExpirationStatus.EXPIRED) {
          return cert.diasRestantes < 0;
        } else if (estado === CertificateExpirationStatus.EXPIRING_SOON) {
          return cert.diasRestantes >= 0 && cert.diasRestantes <= 30;
        } else if (estado === CertificateExpirationStatus.ACTIVE) {
          return cert.diasRestantes > 30;
        }
        return true;
      });
    }

    const totalPaginas = Math.ceil(total / limite);

    return {
      certificados: certificadosConDias,
      total,
      pagina,
      totalPaginas,
    };
  }
}
