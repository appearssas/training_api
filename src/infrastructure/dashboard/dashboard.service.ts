import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, Between, In } from 'typeorm';
import { Capacitacion } from '@/entities/capacitacion/capacitacion.entity';
import { EstadoCapacitacion } from '@/entities/capacitacion/types/capacitacion.types';
import { Inscripcion } from '@/entities/inscripcion/inscripcion.entity';
import { Certificado } from '@/entities/certificados/certificado.entity';
import { Evaluacion } from '@/entities/evaluaciones/evaluacion.entity';
import { Resena } from '@/entities/resenas/resena.entity';
import { EstadoInscripcion } from '@/entities/inscripcion/types/inscripcion.entity';
import { IntentoEvaluacion } from '@/entities/evaluaciones/intento-evaluacion.entity';
import { EstadoIntento } from '@/entities/evaluaciones/types/intento-evaluacion.type';
import { Usuario } from '@/entities/usuarios/usuario.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Capacitacion)
    private readonly capacitacionRepository: Repository<Capacitacion>,
    @InjectRepository(Inscripcion)
    private readonly inscripcionRepository: Repository<Inscripcion>,
    @InjectRepository(Certificado)
    private readonly certificadoRepository: Repository<Certificado>,
    @InjectRepository(Evaluacion)
    private readonly evaluacionRepository: Repository<Evaluacion>,
    @InjectRepository(Resena)
    private readonly resenaRepository: Repository<Resena>,
    @InjectRepository(IntentoEvaluacion)
    private readonly intentoRepository: Repository<IntentoEvaluacion>,
  ) {}

  /**
   * Solo ADMIN ve datos de todas las empresas. Resto (ej. usuario institucional/CLIENTE) solo datos de su empresa.
   */
  async getStats(user: Usuario) {
    const isAdmin = user?.rolPrincipal?.codigo === 'ADMIN';
    const empresaId: number | undefined = isAdmin
      ? undefined
      : (user?.persona?.empresaId ?? undefined);

    const [
      activeCourses,
      enrolledUsers,
      completionRate,
      avgSatisfaction,
      certificatesIssued,
      evaluationsPending,
      upcomingTrainings,
      areaProgress,
      completionTrend,
      notifications,
      recentActivity,
    ] = await Promise.all([
      this.getActiveCourses(empresaId),
      this.getEnrolledUsers(empresaId),
      this.getCompletionRate(empresaId),
      this.getAvgSatisfaction(empresaId),
      this.getCertificatesIssued(empresaId),
      this.getEvaluationsPending(empresaId),
      this.getUpcomingTrainings(empresaId),
      Promise.resolve(this.getAreaProgress()),
      this.getCompletionTrend(empresaId),
      this.getNotifications(empresaId),
      this.getRecentActivity(empresaId),
    ]);

    return {
      kpis: {
        activeCourses,
        enrolledUsers,
        completionRate,
        avgSatisfaction,
        certificatesIssued,
        evaluationsPending,
      },
      upcomingTrainings,
      areaProgress,
      completionTrend,
      notifications,
      recentActivity,
    };
  }

  private async getActiveCourses(empresaId?: number) {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
    );

    if (empresaId == null) {
      // ADMIN: cursos activos globales
      const total = await this.capacitacionRepository.count({
        where: {
          estado: EstadoCapacitacion.PUBLICADA,
          fechaFin: MoreThanOrEqual(now),
        },
      });
      const currentMonth = await this.capacitacionRepository.count({
        where: {
          estado: EstadoCapacitacion.PUBLICADA,
          fechaCreacion: MoreThanOrEqual(currentMonthStart),
        },
      });
      const previousMonth = await this.capacitacionRepository.count({
        where: {
          estado: EstadoCapacitacion.PUBLICADA,
          fechaCreacion: Between(previousMonthStart, currentMonthStart),
        },
      });
      const variation =
        previousMonth > 0
          ? Math.round(((currentMonth - previousMonth) / previousMonth) * 100)
          : 0;
      return { value: total, variation };
    }

    // Por empresa: cursos con al menos un inscrito de la empresa, publicados y no terminados
    const qb = this.capacitacionRepository
      .createQueryBuilder('c')
      .innerJoin('c.inscripciones', 'i')
      .innerJoin('i.estudiante', 'e')
      .where('c.estado = :estado', { estado: EstadoCapacitacion.PUBLICADA })
      .andWhere('c.fechaFin >= :now', { now })
      .andWhere('e.empresaId = :empresaId', { empresaId })
      .select('COUNT(DISTINCT c.id)', 'count');

    const totalRes = await qb.getRawOne();
    const total = parseInt(totalRes?.count || '0', 10);

    const qbCurrent = this.capacitacionRepository
      .createQueryBuilder('c')
      .innerJoin('c.inscripciones', 'i')
      .innerJoin('i.estudiante', 'e')
      .where('c.estado = :estado', { estado: EstadoCapacitacion.PUBLICADA })
      .andWhere('c.fechaCreacion >= :start', { start: currentMonthStart })
      .andWhere('e.empresaId = :empresaId', { empresaId })
      .select('COUNT(DISTINCT c.id)', 'count');
    const currentRes = await qbCurrent.getRawOne();
    const currentMonth = parseInt(currentRes?.count || '0', 10);

    const qbPrevious = this.capacitacionRepository
      .createQueryBuilder('c')
      .innerJoin('c.inscripciones', 'i')
      .innerJoin('i.estudiante', 'e')
      .where('c.estado = :estado', { estado: EstadoCapacitacion.PUBLICADA })
      .andWhere('c.fechaCreacion >= :start', { start: previousMonthStart })
      .andWhere('c.fechaCreacion < :end', { end: currentMonthStart })
      .andWhere('e.empresaId = :empresaId', { empresaId })
      .select('COUNT(DISTINCT c.id)', 'count');
    const previousRes = await qbPrevious.getRawOne();
    const previousMonth = parseInt(previousRes?.count || '0', 10);

    const variation =
      previousMonth > 0
        ? Math.round(((currentMonth - previousMonth) / previousMonth) * 100)
        : 0;
    return { value: total, variation };
  }

  private async getEnrolledUsers(empresaId?: number) {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
    );

    const baseQb = () => {
      const q = this.inscripcionRepository
        .createQueryBuilder('inscripcion')
        .innerJoin('inscripcion.estudiante', 'estudiante');
      if (empresaId != null) {
        q.andWhere('estudiante.empresaId = :empresaId', { empresaId });
      }
      return q;
    };

    const result = await baseQb()
      .select('COUNT(DISTINCT inscripcion.estudiante_id)', 'count')
      .where('inscripcion.estado IN (:...estados)', {
        estados: [EstadoInscripcion.INSCRITO, EstadoInscripcion.EN_PROGRESO],
      })
      .getRawOne();
    const total = parseInt(result?.count || '0');

    const currentResult = await baseQb()
      .select('COUNT(DISTINCT inscripcion.estudiante_id)', 'count')
      .where('inscripcion.fechaInscripcion >= :start', {
        start: currentMonthStart,
      })
      .getRawOne();
    const currentMonth = parseInt(currentResult?.count || '0');

    const previousResult = await baseQb()
      .select('COUNT(DISTINCT inscripcion.estudiante_id)', 'count')
      .where('inscripcion.fechaInscripcion >= :start', {
        start: previousMonthStart,
      })
      .andWhere('inscripcion.fechaInscripcion < :end', {
        end: currentMonthStart,
      })
      .getRawOne();
    const previousMonth = parseInt(previousResult?.count || '0');

    const variation =
      previousMonth > 0
        ? Math.round(((currentMonth - previousMonth) / previousMonth) * 100)
        : 0;
    return { value: total, variation };
  }

  private async getCompletionRate(empresaId?: number) {
    const qb = this.inscripcionRepository
      .createQueryBuilder('inscripcion')
      .innerJoin('inscripcion.estudiante', 'estudiante')
      .select('COUNT(*)', 'total')
      .addSelect(
        'COUNT(CASE WHEN inscripcion.estado = :completo THEN 1 END)',
        'completed',
      )
      .setParameter('completo', EstadoInscripcion.COMPLETADO);
    if (empresaId != null) {
      qb.andWhere('estudiante.empresaId = :empresaId', { empresaId });
    }
    const result = await qb.getRawOne();

    const total = parseInt(result?.total || '0');
    const completed = parseInt(result?.completed || '0');
    const value = total > 0 ? Math.round((completed / total) * 100) : 0;
    const target = 80;
    return { value, target };
  }

  private async getAvgSatisfaction(empresaId?: number) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const qb = this.resenaRepository
      .createQueryBuilder('resena')
      .innerJoin('resena.inscripcion', 'inscripcion')
      .innerJoin('inscripcion.estudiante', 'estudiante')
      .select('AVG(resena.calificacion)', 'avg')
      .where('resena.fechaCreacion >= :date', { date: sixMonthsAgo });
    if (empresaId != null) {
      qb.andWhere('estudiante.empresaId = :empresaId', { empresaId });
    }
    const result = await qb.getRawOne();

    const avg = parseFloat(result?.avg || '0');
    const value = Math.round(avg * 10) / 10;
    return { value };
  }

  private async getCertificatesIssued(empresaId?: number) {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
    );

    if (empresaId == null) {
      const currentMonth = await this.certificadoRepository.count({
        where: { fechaEmision: MoreThanOrEqual(currentMonthStart) },
      });
      const previousMonth = await this.certificadoRepository.count({
        where: {
          fechaEmision: Between(previousMonthStart, currentMonthStart),
        },
      });
      const variation =
        previousMonth > 0
          ? Math.round(((currentMonth - previousMonth) / previousMonth) * 100)
          : 0;
      return { value: currentMonth, variation };
    }

    const qb = (alias: string) =>
      this.certificadoRepository
        .createQueryBuilder(alias)
        .innerJoin(`${alias}.inscripcion`, 'inscripcion')
        .innerJoin('inscripcion.estudiante', 'estudiante')
        .where('estudiante.empresaId = :empresaId', { empresaId });

    const currentMonth = await qb('cert')
      .andWhere('cert.fechaEmision >= :start', { start: currentMonthStart })
      .getCount();
    const previousMonth = await qb('cert')
      .andWhere('cert.fechaEmision >= :start', { start: previousMonthStart })
      .andWhere('cert.fechaEmision < :end', { end: currentMonthStart })
      .getCount();
    const variation =
      previousMonth > 0
        ? Math.round(((currentMonth - previousMonth) / previousMonth) * 100)
        : 0;
    return { value: currentMonth, variation };
  }

  private async getEvaluationsPending(empresaId?: number) {
    if (empresaId == null) {
      const count = await this.intentoRepository.count({
        where: { estado: EstadoIntento.EN_PROGRESO },
      });
      return { value: count };
    }
    const count = await this.intentoRepository
      .createQueryBuilder('intento')
      .innerJoin('intento.inscripcion', 'inscripcion')
      .innerJoin('inscripcion.estudiante', 'estudiante')
      .where('intento.estado = :estado', { estado: EstadoIntento.EN_PROGRESO })
      .andWhere('estudiante.empresaId = :empresaId', { empresaId })
      .getCount();
    return { value: count };
  }

  private async getUpcomingTrainings(empresaId?: number) {
    const now = new Date();

    if (empresaId == null) {
      const trainings = await this.capacitacionRepository.find({
        where: {
          fechaInicio: MoreThanOrEqual(now),
          estado: EstadoCapacitacion.PUBLICADA,
        },
        order: { fechaInicio: 'ASC' },
        take: 5,
        relations: ['modalidad'],
      });
      return this.mapUpcomingTrainings(trainings);
    }

    const trainings = await this.capacitacionRepository
      .createQueryBuilder('c')
      .innerJoin('c.inscripciones', 'i')
      .innerJoin('i.estudiante', 'e')
      .where('c.fechaInicio >= :now', { now })
      .andWhere('c.estado = :estado', { estado: EstadoCapacitacion.PUBLICADA })
      .andWhere('e.empresaId = :empresaId', { empresaId })
      .orderBy('c.fechaInicio', 'ASC')
      .take(5)
      .getMany();

    const withModalidad = await this.capacitacionRepository.find({
      where: { id: In(trainings.map(t => t.id)) },
      relations: ['modalidad'],
      order: { fechaInicio: 'ASC' },
    });
    return this.mapUpcomingTrainings(withModalidad);
  }

  private mapUpcomingTrainings(trainings: Capacitacion[]): Array<{
    id: number;
    title: string;
    date: string;
    time: string;
    duration: string;
    modality: string;
    statusLabel: string;
    statusColor: string;
    color: string;
    short: string;
  }> {
    return trainings.map(training => {
      const date = new Date(training.fechaInicio);
      const short = training.titulo
        .split(' ')
        .map(w => w[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

      const statusLabel = 'Programada';
      const statusColor = 'info';

      return {
        id: training.id,
        title: training.titulo,
        date: date.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'short',
        }),
        time: date.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        duration: training.duracionHoras ? `${training.duracionHoras}h` : 'N/A',
        modality: training.modalidad?.nombre || 'Online',
        statusLabel,
        statusColor,
        color: 'primary',
        short,
      };
    });
  }

  private getAreaProgress() {
    // TODO: Implementar cuando se cree tabla de áreas en la BD
    // Actualmente Capacitacion solo tiene areaId pero no hay relación
    return [];
  }

  private async getCompletionTrend(empresaId?: number) {
    const months: Array<{ label: string; value: number }> = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const qb = this.inscripcionRepository
        .createQueryBuilder('inscripcion')
        .innerJoin('inscripcion.estudiante', 'estudiante')
        .select('COUNT(*)', 'total')
        .addSelect(
          'COUNT(CASE WHEN inscripcion.estado = :completo THEN 1 END)',
          'completed',
        )
        .where('inscripcion.fechaInscripcion >= :start', { start: monthDate })
        .andWhere('inscripcion.fechaInscripcion < :end', { end: nextMonth })
        .setParameter('completo', EstadoInscripcion.COMPLETADO);
      if (empresaId != null) {
        qb.andWhere('estudiante.empresaId = :empresaId', { empresaId });
      }
      const result = await qb.getRawOne();

      const total = parseInt(result?.total || '0');
      const completed = parseInt(result?.completed || '0');
      const value = total > 0 ? Math.round((completed / total) * 100) : 0;
      months.push({
        label: monthDate.toLocaleDateString('es-ES', { month: 'short' }),
        value,
      });
    }
    return months;
  }

  private async getNotifications(empresaId?: number) {
    const now = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(now.getDate() + 30);

    if (empresaId == null) {
      const certificates = await this.certificadoRepository.find({
        where: {
          fechaVencimiento: Between(now, thirtyDaysLater),
        },
        relations: [
          'inscripcion',
          'inscripcion.estudiante',
          'inscripcion.capacitacion',
        ],
        take: 5,
        order: { fechaVencimiento: 'ASC' },
      });
      return this.mapNotifications(certificates);
    }

    const certIds = await this.certificadoRepository
      .createQueryBuilder('cert')
      .innerJoin('cert.inscripcion', 'inscripcion')
      .innerJoin('inscripcion.estudiante', 'estudiante')
      .where('cert.fechaVencimiento BETWEEN :now AND :end', {
        now,
        end: thirtyDaysLater,
      })
      .andWhere('estudiante.empresaId = :empresaId', { empresaId })
      .orderBy('cert.fechaVencimiento', 'ASC')
      .take(5)
      .select(['cert.id', 'cert.fechaVencimiento'])
      .getMany();

    const ids = certIds.map(c => c.id);
    if (ids.length === 0) return [];

    const certificates = await this.certificadoRepository.find({
      where: { id: In(ids) },
      relations: [
        'inscripcion',
        'inscripcion.estudiante',
        'inscripcion.capacitacion',
      ],
      order: { fechaVencimiento: 'ASC' },
    });
    return this.mapNotifications(certificates);
  }

  private mapNotifications(certificates: Certificado[]): Array<{
    id: string;
    type: string;
    message: string;
    detail: string;
    time: string;
  }> {
    return certificates.map(cert => ({
      id: `cert-${cert.id}`,
      type: 'warning',
      message: `Certificado por vencer: ${cert.inscripcion?.capacitacion?.titulo}`,
      detail: `Usuario: ${cert.inscripcion?.estudiante?.nombres} ${cert.inscripcion?.estudiante?.apellidos || ''} - Vence: ${new Date(cert.fechaVencimiento).toLocaleDateString()}`,
      time: 'Pronto',
    }));
  }

  private async getRecentActivity(empresaId?: number) {
    if (empresaId == null) {
      const recentEnrollments = await this.inscripcionRepository.find({
        relations: ['estudiante', 'capacitacion'],
        order: { fechaInscripcion: 'DESC' },
        take: 5,
      });
      const recentCertificates = await this.certificadoRepository.find({
        relations: [
          'inscripcion',
          'inscripcion.estudiante',
          'inscripcion.capacitacion',
        ],
        order: { fechaEmision: 'DESC' },
        take: 5,
      });
      return this.buildRecentActivity(recentEnrollments, recentCertificates);
    }

    const recentEnrollments = await this.inscripcionRepository
      .createQueryBuilder('inscripcion')
      .innerJoinAndSelect('inscripcion.estudiante', 'estudiante')
      .innerJoinAndSelect('inscripcion.capacitacion', 'capacitacion')
      .where('estudiante.empresaId = :empresaId', { empresaId })
      .orderBy('inscripcion.fechaInscripcion', 'DESC')
      .take(5)
      .getMany();

    const recentCertificates = await this.certificadoRepository
      .createQueryBuilder('cert')
      .innerJoin('cert.inscripcion', 'inscripcion')
      .innerJoin('inscripcion.estudiante', 'estudiante')
      .leftJoinAndSelect('cert.inscripcion', 'i')
      .leftJoinAndSelect('i.estudiante', 'e')
      .leftJoinAndSelect('i.capacitacion', 'cap')
      .where('estudiante.empresaId = :empresaId', { empresaId })
      .orderBy('cert.fechaEmision', 'DESC')
      .take(5)
      .getMany();

    return this.buildRecentActivity(recentEnrollments, recentCertificates);
  }

  private buildRecentActivity(
    recentEnrollments: Inscripcion[],
    recentCertificates: Certificado[],
  ): Array<{
    id: string;
    icon: string;
    color: string;
    title: string;
    description: string;
    timestamp: Date;
    time: string;
  }> {
    const activities = [
      ...recentEnrollments.map(ins => ({
        id: `ins-${ins.id}`,
        icon: 'person_add',
        color: 'primary',
        title: 'Nuevo alumno inscrito',
        description: `${ins.estudiante?.nombres} ${ins.estudiante?.apellidos || ''} se inscribió en ${ins.capacitacion?.titulo}`,
        timestamp: ins.fechaInscripcion,
      })),
      ...recentCertificates.map(cert => ({
        id: `cert-${cert.id}`,
        icon: 'school',
        color: 'positive',
        title: 'Certificado emitido',
        description: `Certificado emitido para ${cert.inscripcion?.estudiante?.nombres} ${cert.inscripcion?.estudiante?.apellidos || ''} en ${cert.inscripcion?.capacitacion?.titulo}`,
        timestamp: cert.fechaEmision,
      })),
    ];

    // Ordenar combinado por fecha descendente
    return activities
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, 10)
      .map(activity => {
        // Calcular tiempo relativo simple
        const diff =
          new Date().getTime() - new Date(activity.timestamp).getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        let timeLabel = '';
        if (days > 0) timeLabel = `hace ${days} días`;
        else if (hours > 0) timeLabel = `hace ${hours} horas`;
        else timeLabel = 'hace unos momentos';

        return {
          ...activity,
          time: timeLabel,
        };
      });
  }
}
