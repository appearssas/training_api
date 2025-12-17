import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { Persona } from '../persona/persona.entity';
import { Rol } from './rol.entity';

@Entity('persona_roles')
@Unique(['persona', 'rol'])
export class PersonaRol {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Persona, (persona: Persona) => persona.roles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'persona_id' })
  persona: Persona;

  @ManyToOne(() => Rol, (rol: Rol) => rol.personaRoles)
  @JoinColumn({ name: 'rol_id' })
  rol: Rol;

  @Index()
  @Column({ type: 'tinyint', default: 1 })
  activo: boolean;

  @CreateDateColumn({ name: 'fecha_asignacion' })
  fechaAsignacion: Date;
}
