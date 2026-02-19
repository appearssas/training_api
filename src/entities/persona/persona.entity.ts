import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';
import { Alumno } from '../alumnos/alumno.entity';
import { Instructor } from '../instructores/instructor.entity';
import { Inscripcion } from '../inscripcion/inscripcion.entity';
import { PersonaRol } from '../roles/persona-rol.entity';
import { Empresa } from '../empresas/empresa.entity';
import { Genero } from './types';

@Entity('personas')
export class Persona {
  @PrimaryGeneratedColumn()
  id: number;

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
    default: 'CC',
    name: 'tipo_documento',
  })
  tipoDocumento: string;

  @Column({
    type: 'enum',
    enum: ['NATURAL', 'JURIDICA'],
    default: 'NATURAL',
    name: 'tipo_persona',
  })
  tipoPersona: 'NATURAL' | 'JURIDICA';

  @Column({ type: 'varchar', length: 200 })
  nombres: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  apellidos: string;

  @Column({ type: 'int', nullable: true, name: 'empresa_id' })
  empresaId: number;

  // Relación con Empresa
  // Una persona pertenece a una empresa (opcional)
  @ManyToOne(() => Empresa, (empresa: Empresa) => empresa.personas, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Index()
  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  telefono: string;

  @Column({ type: 'date', nullable: true, name: 'fecha_nacimiento' })
  fechaNacimiento: Date;

  @Column({
    type: 'enum',
    enum: Genero,
    nullable: true,
  })
  genero: Genero;

  @Column({ type: 'text', nullable: true })
  direccion: string;

  @Column({ type: 'text', nullable: true })
  biografia: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'foto_url' })
  fotoUrl: string;

  @Index()
  @Column({ type: 'tinyint', default: 1 })
  activo: boolean;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: 'fecha_actualizacion' })
  fechaActualizacion: Date;

  // Relaciones
  // OBLIGATORIO: Una persona DEBE tener un usuario para acceder al sistema
  @OneToOne(() => Usuario, (usuario: Usuario) => usuario.persona, {
    nullable: false,
  })
  usuario: Usuario;

  // Roles asignados a la persona (muchos a muchos)
  // OBLIGATORIO: Una persona DEBE tener al menos un rol activo (ALUMNO o INSTRUCTOR)
  @OneToMany(() => PersonaRol, (personaRol: PersonaRol) => personaRol.persona)
  roles: PersonaRol[];

  // Una persona puede ser alumno (datos específicos del rol ALUMNO)
  @OneToOne(() => Alumno, (alumno: Alumno) => alumno.persona, {
    nullable: true,
  })
  alumno: Alumno;

  // Una persona puede ser instructor (datos específicos del rol INSTRUCTOR)
  @OneToOne(() => Instructor, (instructor: Instructor) => instructor.persona, {
    nullable: true,
  })
  instructor: Instructor;

  @OneToMany(
    () => Inscripcion,
    (inscripcion: Inscripcion) => inscripcion.estudiante,
  )
  inscripciones: Inscripcion[];
}
