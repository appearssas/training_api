import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';
import { AceptacionPolitica } from '../aceptaciones/aceptacion-politica.entity';

@Entity('documentos_legales')
export class DocumentoLegal {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'varchar', length: 50 })
  tipo: string;

  @Column({ type: 'varchar', length: 200 })
  titulo: string;

  @Column({ type: 'longtext' })
  contenido: string;

  @Column({ type: 'varchar', length: 20, default: '1.0' })
  version: string;

  @Column({
    type: 'tinyint',
    default: 0,
    name: 'requiere_firma_digital',
  })
  requiereFirmaDigital: boolean;

  @Index()
  @Column({ type: 'tinyint', default: 1 })
  activo: boolean;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: 'fecha_actualizacion' })
  fechaActualizacion: Date;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'creado_por' })
  creadoPor: Usuario;

  @OneToMany(
    () => AceptacionPolitica,
    (aceptacion: AceptacionPolitica) => aceptacion.documentoLegal,
  )
  aceptaciones: AceptacionPolitica[];
}
