import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Persona } from '../persona/persona.entity';

@Entity('empresas')
export class Empresa {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({
    type: 'varchar',
    length: 50,
    unique: true,
    name: 'numero_documento',
  })
  numeroDocumento: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'NIT',
    name: 'tipo_documento',
  })
  tipoDocumento: string;

  @Column({
    type: 'varchar',
    length: 500,
    name: 'razon_social',
  })
  razonSocial: string;

  @Index()
  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  telefono: string;

  @Column({ type: 'text', nullable: true })
  direccion: string;

  @Index()
  @Column({ type: 'tinyint', default: 1 })
  activo: boolean;

  @Column({ type: 'tinyint', default: 0, name: 'eliminada' })
  eliminada: boolean;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: 'fecha_actualizacion' })
  fechaActualizacion: Date;

  // Relaciones
  // Una empresa tiene muchas personas
  @OneToMany(() => Persona, (persona: Persona) => persona.empresa)
  personas: Persona[];
}

