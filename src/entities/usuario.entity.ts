import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Persona } from './persona.entity';
import { Rol } from './roles/rol.entity';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  // OBLIGATORIO: Una persona DEBE tener un usuario
  @OneToOne(() => Persona, (persona) => persona.usuario, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'persona_id' })
  persona: Persona;

  @Index()
  @Column({ type: 'varchar', length: 100, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 255, name: 'password_hash' })
  passwordHash: string;

  @ManyToOne(() => Rol, { nullable: true })
  @JoinColumn({ name: 'rol_principal_id' })
  rolPrincipal: Rol;

  @Column({ type: 'tinyint', default: 1 })
  activo: boolean;

  @Column({ type: 'datetime', nullable: true, name: 'ultimo_acceso' })
  ultimoAcceso: Date;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: 'fecha_actualizacion' })
  fechaActualizacion: Date;
}
