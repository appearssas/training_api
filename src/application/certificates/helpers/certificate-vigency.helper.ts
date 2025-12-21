import { Injectable } from '@nestjs/common';
import { Capacitacion } from '@/entities/capacitacion/capacitacion.entity';

@Injectable()
export class CertificateVigencyHelper {
  /**
   * Calcula la fecha de vencimiento de un certificado
   * basándose en la duración de vigencia del curso
   *
   * @param fechaEmision - Fecha de emisión del certificado
   * @param capacitacion - Capacitación asociada
   * @returns Fecha de vencimiento o null si el curso no tiene vigencia limitada
   */
  calculateExpirationDate(
    fechaEmision: Date,
    capacitacion: Capacitacion,
  ): Date | null {
    if (!capacitacion.duracionVigenciaDias) {
      return null; // Certificado sin vencimiento
    }

    const fechaVencimiento = new Date(fechaEmision);
    fechaVencimiento.setDate(
      fechaVencimiento.getDate() + capacitacion.duracionVigenciaDias,
    );

    return fechaVencimiento;
  }

  /**
   * Calcula los días restantes hasta el vencimiento
   *
   * @param fechaVencimiento - Fecha de vencimiento del certificado
   * @returns Número de días restantes (puede ser negativo si ya venció)
   */
  calculateDaysUntilExpiration(fechaVencimiento: Date): number {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const vencimiento = new Date(fechaVencimiento);
    vencimiento.setHours(0, 0, 0, 0);

    const diffTime = vencimiento.getTime() - hoy.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  /**
   * Determina si un certificado está próximo a vencer
   *
   * @param fechaVencimiento - Fecha de vencimiento
   * @param diasAntes - Días antes del vencimiento para considerar "próximo"
   * @returns true si está próximo a vencer
   */
  isExpiringSoon(fechaVencimiento: Date, diasAntes: number): boolean {
    const diasRestantes = this.calculateDaysUntilExpiration(fechaVencimiento);
    return diasRestantes <= diasAntes && diasRestantes >= 0;
  }

  /**
   * Determina si un certificado ya venció
   */
  isExpired(fechaVencimiento: Date): boolean {
    return this.calculateDaysUntilExpiration(fechaVencimiento) < 0;
  }
}
