import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Persona } from '../persona/persona.entity';
import { Capacitacion } from '../capacitacion/capacitacion.entity';
import { Usuario } from '../usuarios/usuario.entity';

@Entity('pagos')
export class Pago {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Persona)
  @JoinColumn({ name: 'estudiante_id' })
  estudiante: Persona;

  @ManyToOne(() => Capacitacion)
  @JoinColumn({ name: 'capacitacion_id' })
  capacitacion: Capacitacion;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto: number;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'metodo_pago',
  })
  metodoPago: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'numero_comprobante',
  })
  numeroComprobante: string;

  @CreateDateColumn({ name: 'fecha_pago' })
  fechaPago: Date;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'registrado_por' })
  registradoPor: Usuario;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({ type: 'tinyint', default: 1 })
  activo: boolean;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;
}
