import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';
import { DocumentoLegal } from '../documentos/documento-legal.entity';

@Entity('aceptaciones_politicas')
export class AceptacionPolitica {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @ManyToOne(() => DocumentoLegal)
  @JoinColumn({ name: 'documento_legal_id' })
  documentoLegal: DocumentoLegal;

  @Column({ type: 'varchar', length: 20 })
  version: string;

  @Column({
    type: 'text',
    nullable: true,
    name: 'firma_digital',
  })
  firmaDigital: string;

  @Column({
    type: 'varchar',
    length: 45,
    nullable: true,
    name: 'ip_address',
  })
  ipAddress: string;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    name: 'user_agent',
  })
  userAgent: string;

  @Index()
  @CreateDateColumn({ name: 'fecha_aceptacion' })
  fechaAceptacion: Date;
}
