import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, Between } from 'typeorm';
import { Capacitacion } from '@/entities/capacitacion/capacitacion.entity';
import { EstadoCapacitacion } from '@/entities/capacitacion/types/capacitacion.types';
import { Inscripcion } from '@/entities/inscripcion/inscripcion.entity';
import { Certificado } from '@/entities/certificados/certificado.entity';
import { Evaluacion } from '@/entities/evaluaciones/evaluacion.entity';
import { Resena } from '@/entities/resenas/resena.entity';
import { EstadoInscripcion } from '@/entities/inscripcion/types/inscripcion.entity';
import { IntentoEvaluacion } from '@/entities/evaluaciones/intento-evaluacion.entity';
import { EstadoIntento } from '@/entities/evaluaciones/types/intento-evaluacion.type';

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

  async getStats() {
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
      this.getActiveCourses(),
      this.getEnrolledUsers(),
      this.getCompletionRate(),
      this.getAvgSatisfaction(),
      this.getCertificatesIssued(),
      this.getEvaluationsPending(),
      this.getUpcomingTrainings(),
      this.getAreaProgress(),
      this.getCompletionTrend(),
      this.getNotifications(),
      this.getRecentActivity(),
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

  private async getActiveCourses() {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
    );

    // Cursos activos (publicados y que no han terminado)
    const total = await this.capacitacionRepository.count({
      where: {
        estado: EstadoCapacitacion.PUBLICADA,
        fechaFin: MoreThanOrEqual(now),
      },
    });

    // Del mes actual
    const currentMonth = await this.capacitacionRepository.count({
      where: {
        estado: EstadoCapacitacion.PUBLICADA,
        fechaCreacion: MoreThanOrEqual(currentMonthStart),
      },
    });

    // Del mes anterior
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

  private async getEnrolledUsers() {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
    );

    // Total de usuarios inscritos activos
    const result = await this.inscripcionRepository
      .createQueryBuilder('inscripcion')
      .select('COUNT(DISTINCT inscripcion.estudiante_id)', 'count')
      .where('inscripcion.estado IN (:...estados)', {
        estados: [EstadoInscripcion.INSCRITO, EstadoInscripcion.EN_PROGRESO],
      })
      .getRawOne();

    const total = parseInt(result?.count || '0');

    // Del mes actual
    const currentResult = await this.inscripcionRepository
      .createQueryBuilder('inscripcion')
      .select('COUNT(DISTINCT inscripcion.estudiante_id)', 'count')
      .where('inscripcion.fechaInscripcion >= :start', {
        start: currentMonthStart,
      })
      .getRawOne();

    const currentMonth = parseInt(currentResult?.count || '0');

    // Del mes anterior
    const previousResult = await this.inscripcionRepository
      .createQueryBuilder('inscripcion')
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

  private async getCompletionRate() {
    const result = await this.inscripcionRepository
      .createQueryBuilder('inscripcion')
      .select('COUNT(*)', 'total')
      .addSelect(
        'COUNT(CASE WHEN inscripcion.estado = :completo THEN 1 END)',
        'completed',
      )
      .setParameters({ completo: EstadoInscripcion.COMPLETADO })
      .getRawOne();

    const total = parseInt(result?.total || '0');
    const completed = parseInt(result?.completed || '0');

    const value = total > 0 ? Math.round((completed / total) * 100) : 0;
    const target = 80; // Objetivo fijo

    return { value, target };
  }

  private async getAvgSatisfaction() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const result = await this.resenaRepository
      .createQueryBuilder('resena')
      .select('AVG(resena.calificacion)', 'avg')
      .where('resena.fechaCreacion >= :date', { date: sixMonthsAgo })
      .getRawOne();

    const avg = parseFloat(result?.avg || '0');
    const value = Math.round(avg * 10) / 10; // Redondear a 1 decimal

    return { value };
  }

  private async getCertificatesIssued() {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
    );

    // Del mes actual
    const currentMonth = await this.certificadoRepository.count({
      where: {
        fechaEmision: MoreThanOrEqual(currentMonthStart),
      },
    });

    // Del mes anterior
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

  private async getEvaluationsPending() {
    // Contar evaluaciones en progreso
    const count = await this.intentoRepository.count({
      where: {
        estado: EstadoIntento.EN_PROGRESO,
      },
    });
    return { value: count };
  }

  private async getUpcomingTrainings() {
    const now = new Date();
    const trainings = await this.capacitacionRepository.find({
      where: {
        fechaInicio: MoreThanOrEqual(now),
        estado: EstadoCapacitacion.PUBLICADA,
      },
      order: {
        fechaInicio: 'ASC',
      },
      take: 5,
      relations: ['modalidad'],
    });

    return trainings.map(training => {
      const date = new Date(training.fechaInicio);
      const short = training.titulo
        .split(' ')
        .map(w => w[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

      let statusLabel = 'Programada';
      let statusColor = 'info';

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

  private async getAreaProgress() {
    // TODO: Implementar cuando se cree tabla de áreas en la BD
    // Actualmente Capacitacion solo tiene areaId pero no hay relación
    return [];
  }

  private async getCompletionTrend() {
    const months: Array<{ label: string; value: number }> = [];
    const now = new Date();

    // Últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const result = await this.inscripcionRepository
        .createQueryBuilder('inscripcion')
        .select('COUNT(*)', 'total')
        .addSelect(
          'COUNT(CASE WHEN inscripcion.estado = :completo THEN 1 END)',
          'completed',
        )
        .where('inscripcion.fechaInscripcion >= :start', { start: monthDate })
        .andWhere('inscripcion.fechaInscripcion < :end', { end: nextMonth })
        .setParameter('completo', EstadoInscripcion.COMPLETADO)
        .getRawOne();

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

  private async getNotifications() {
    // Certificados próximos a vencer (30 días)
    const now = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(now.getDate() + 30);

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
      order: {
        fechaVencimiento: 'ASC',
      },
    });

    return certificates.map(cert => ({
      id: `cert-${cert.id}`,
      type: 'warning',
      message: `Certificado por vencer: ${cert.inscripcion?.capacitacion?.titulo}`,
      detail: `Usuario: ${cert.inscripcion?.estudiante?.nombres} ${cert.inscripcion?.estudiante?.apellidos || ''} - Vence: ${new Date(cert.fechaVencimiento).toLocaleDateString()}`,
      time: 'Pronto',
    }));
  }

  private async getRecentActivity() {
    // 1. Últimas inscripciones
    const recentEnrollments = await this.inscripcionRepository.find({
      relations: ['estudiante', 'capacitacion'],
      order: { fechaInscripcion: 'DESC' },
      take: 5,
    });

    // 2. Últimos certificados
    const recentCertificates = await this.certificadoRepository.find({
      relations: [
        'inscripcion',
        'inscripcion.estudiante',
        'inscripcion.capacitacion',
      ],
      order: { fechaEmision: 'DESC' },
      take: 5,
    });

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
