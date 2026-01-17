import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';

/**
 * Entidad para configurar las estrategias de cierre de sesión
 * Permite configurar tiempos de inactividad y tiempo máximo de sesión
 */
@Entity('configuracion_sesion')
export class ConfiguracionSesion {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Tiempo de inactividad en minutos antes de cerrar sesión
   * Si es null, la funcionalidad está deshabilitada
   */
  @Column({ type: 'int', nullable: true, name: 'tiempo_inactividad_minutos' })
  tiempoInactividadMinutos: number | null;

  /**
   * Tiempo máximo de sesión en minutos (máximo 60 minutos = 1 hora)
   * Si es null, la funcionalidad está deshabilitada
   */
  @Column({ type: 'int', nullable: true, name: 'tiempo_maximo_sesion_minutos' })
  tiempoMaximoSesionMinutos: number | null;

  /**
   * Indica si la configuración está activa
   */
  @Column({ type: 'tinyint', default: 1 })
  activo: boolean;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: 'fecha_actualizacion' })
  fechaActualizacion: Date;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'creado_por' })
  creadoPor: Usuario;
}
