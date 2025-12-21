import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { IAuthRepository } from '@/domain/auth/ports/auth.repository.port';
import { Usuario } from '../../entities/usuarios/usuario.entity';
import { Persona } from '@/entities/persona/persona.entity';
import { Rol } from '@/entities/roles/rol.entity';
import { PersonaRol } from '@/entities/roles/persona-rol.entity';
import { Alumno } from '@/entities/alumnos/alumno.entity';
import { Instructor } from '@/entities/instructores/instructor.entity';
import {
  comparePassword,
  hashPassword,
} from '@/infrastructure/shared/helpers/bcrypt.helper';
import {
  generarCodigoEstudiante,
  extraerNumeroSecuencial,
} from '@/infrastructure/shared/helpers/codigo-estudiante.helper';

@Injectable()
export class AuthRepositoryAdapter implements IAuthRepository {
  private readonly logger = new Logger(AuthRepositoryAdapter.name);

  constructor(
    @InjectRepository(Usuario)
    private readonly userRepository: Repository<Usuario>,
    @InjectRepository(Persona)
    private readonly personaRepository: Repository<Persona>,
    @InjectRepository(Rol)
    private readonly rolRepository: Repository<Rol>,
    @InjectRepository(PersonaRol)
    private readonly personaRolRepository: Repository<PersonaRol>,
    @InjectRepository(Alumno)
    private readonly alumnoRepository: Repository<Alumno>,
    @InjectRepository(Instructor)
    private readonly instructorRepository: Repository<Instructor>,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
  ) {}

  async findByUsername(usernameOrEmail: string): Promise<Usuario | null> {
    this.logger.log(
      `[findByUsername] Buscando usuario con username/email: ${usernameOrEmail}`,
    );

    let whereCondition: any = {
      username: usernameOrEmail,
      // activo: true, // REMOVED: Allow inactive users to be found for proper error handling
    };

    // Si parece un email, buscamos primero la persona
    if (usernameOrEmail.includes('@')) {
      const persona = await this.personaRepository.findOne({
        where: { email: usernameOrEmail },
      });

      if (!persona) {
        this.logger.log(
          `[findByUsername] Persona no encontrada para email: ${usernameOrEmail}`,
        );
        return null; // Persona not found logic remains
      }

      whereCondition = {
        persona: { id: persona.id },
        // activo: true, // REMOVED
      };
    }

    const user = await this.userRepository.findOne({
      where: whereCondition,
      relations: ['persona', 'rolPrincipal'],
      select: {
        id: true,
        username: true,
        passwordHash: true,
        activo: true,
        habilitado: true,
        persona: {
          id: true,
          nombres: true,
          apellidos: true,
          email: true,
          activo: true,
        },
        rolPrincipal: {
          id: true,
          codigo: true,
          nombre: true,
        },
      },
    });

    if (user) {
      this.logger.log(
        `[findByUsername] Usuario encontrado: ID ${user.id}, activo: ${user.activo}, habilitado: ${user.habilitado}`,
      );
    } else {
      this.logger.log(
        `[findByUsername] Usuario no encontrado para: ${usernameOrEmail}`,
      );
    }

    // We return the user even if inactive/disabled so the UseCase can throw specific exceptions
    return user ?? null;
  }

  comparePassword(password: string, hashedPassword: string): boolean {
    return comparePassword(password, hashedPassword);
  }

  generateToken(user: Usuario): string {
    const payload = {
      id: user.id,
      username: user.username,
      email: user.persona?.email || undefined,
      rol: user.rolPrincipal?.codigo || undefined,
    };
    return this.jwtService.sign(payload);
  }

  generateTokenWithMetadata(user: Usuario): {
    access_token: string;
    expires_in: string;
  } {
    const payload = {
      id: user.id,
      username: user.username,
      email: user.persona?.email || undefined,
      rol: user.rolPrincipal?.codigo || undefined,
    };
    const access_token = this.jwtService.sign(payload);
    // JWT expira en 24h por defecto (configurado en auth.module.ts)
    // Retornamos en formato de segundos para expires_in
    const expires_in = '86400'; // 24 horas en segundos

    return {
      access_token,
      expires_in,
    };
  }

  async findByEmail(email: string): Promise<Persona | null> {
    return await this.personaRepository.findOne({
      where: { email },
    });
  }

  async findByNumeroDocumento(
    numeroDocumento: string,
  ): Promise<Persona | null> {
    return await this.personaRepository.findOne({
      where: { numeroDocumento },
    });
  }

  hashPassword(password: string): string {
    return hashPassword(password);
  }

  async findRolByCodigo(codigo: string): Promise<Rol | null> {
    return await this.rolRepository.findOne({
      where: { codigo, activo: true },
    });
  }

  async createPersonaWithUsuario(
    personaData: Partial<Persona>,
    usuarioData: { username: string; passwordHash: string },
    rolCodigo: string,
  ): Promise<Usuario> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Crear persona
      const persona = this.personaRepository.create({
        ...personaData,
        activo: true,
      });
      const savedPersona = await queryRunner.manager.save(persona);

      // 2. Buscar rol
      const rol = await this.rolRepository.findOne({
        where: { codigo: rolCodigo },
      });

      if (!rol) {
        throw new Error(`El rol ${rolCodigo} no existe`);
      }

      // 3. Crear usuario
      const usuario = this.userRepository.create({
        ...usuarioData,
        persona: savedPersona,
        rolPrincipal: rol,
        activo: true,
        habilitado: false, // Por defecto inhabilitado hasta aprobación
      });
      const savedUsuario = await queryRunner.manager.save(usuario);

      // 4. Asignar rol a persona
      const personaRol = new PersonaRol();
      personaRol.persona = savedPersona;
      personaRol.rol = rol;
      personaRol.activo = true;
      await queryRunner.manager.save(personaRol);

      // 5. Crear registro específico según rol
      if (rolCodigo === 'ALUMNO') {
        const alumno = new Alumno();
        alumno.persona = savedPersona;
        alumno.esExterno = false;
        alumno.activo = true;
        await queryRunner.manager.save(alumno);
      } else if (rolCodigo === 'INSTRUCTOR') {
        const instructor = new Instructor();
        instructor.persona = savedPersona;
        instructor.totalCapacitaciones = 0;
        instructor.totalEstudiantes = 0;
        instructor.activo = true;
        await queryRunner.manager.save(instructor);
      }

      await queryRunner.commitTransaction();
      return savedUsuario;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updatePersona(id: number, data: Partial<Persona>): Promise<Persona> {
    await this.personaRepository.update(id, data);
    return await this.personaRepository.findOneOrFail({ where: { id } });
  }

  async saveUser(user: Usuario): Promise<Usuario> {
    return await this.userRepository.save(user);
  }

  async updatePassword(
    usuarioId: number,
    nuevaPassword: string,
  ): Promise<void> {
    const passwordHash = this.hashPassword(nuevaPassword);
    await this.userRepository.update(usuarioId, {
      passwordHash,
      debeCambiarPassword: false, // Ya no debe cambiar la contraseña
    });
  }

  /**
   * Genera un código de estudiante único para el año actual
   * Busca el último código del año y genera el siguiente número secuencial
   */
  private async generarCodigoEstudianteUnico(
    alumnoRepository: Repository<Alumno>,
  ): Promise<string> {
    const año = new Date().getFullYear();
    const prefijo = `EST${año}`;

    // Buscar el último código de estudiante del año actual
    const ultimoAlumno = await alumnoRepository
      .createQueryBuilder('alumno')
      .where('alumno.codigoEstudiante LIKE :prefijo', {
        prefijo: `${prefijo}%`,
      })
      .andWhere('alumno.codigoEstudiante IS NOT NULL')
      .orderBy('alumno.codigoEstudiante', 'DESC')
      .getOne();

    let siguienteNumero = 1;

    if (ultimoAlumno && ultimoAlumno.codigoEstudiante) {
      const numeroExtraido = extraerNumeroSecuencial(
        ultimoAlumno.codigoEstudiante,
      );
      if (numeroExtraido !== null) {
        siguienteNumero = numeroExtraido + 1;
      }
    }

    return generarCodigoEstudiante(siguienteNumero - 1);
  }
}
