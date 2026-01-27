import { Certificado } from '@/entities/certificados/certificado.entity';
import { CreateCertificadoDto } from '@/application/certificados/dto/create-certificado.dto';
import { UpdateCertificadoDto } from '@/application/certificados/dto/update-certificado.dto';
import { PaginationDto } from '@/application/shared/dto/pagination.dto';

/**
 * Contexto del usuario para filtrar certificados según rol:
 * - ADMIN: ve todos (no se aplica filtro).
 * - INSTRUCTOR: solo certificados de capacitaciones donde él es el instructor.
 * - ALUMNO, CLIENTE, OPERADOR: solo certificados donde él es el estudiante de la inscripción.
 */
export interface CertificadosUserContext {
  rol: string;
  personaId: number | null;
}

/**
 * Puerto para el repositorio de Certificados
 * Sigue principios SOLID: Interface Segregation y Dependency Inversion
 */
export interface ICertificadosRepository {
  create(createCertificadoDto: CreateCertificadoDto): Promise<Certificado>;
  findAll(pagination: PaginationDto, userContext?: CertificadosUserContext): Promise<any>;
  findOne(id: number): Promise<Certificado | null>;
  findByInscripcion(inscripcionId: number): Promise<Certificado[]>;
  findByEstudiante(estudianteId: number, pagination?: PaginationDto): Promise<any>;
  findByHashVerificacion(hash: string): Promise<Certificado | null>;
  update(id: number, updateCertificadoDto: UpdateCertificadoDto): Promise<Certificado>;
  remove(id: number): Promise<void>;
}

