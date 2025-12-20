import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { IAuthRepository } from '@/domain/auth/ports/auth.repository.port';
import { Usuario } from '@/entities/usuarios/usuario.entity';
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

  async findByUsername(username: string): Promise<Usuario | null> {
    this.logger.log(`[findByUsername] Buscando usuario con username/email: ${username}`);

    try {
      // Intentar primero buscar por username
      let user = await this.userRepository
        .createQueryBuilder('usuario')
        .leftJoinAndSelect('usuario.persona', 'persona')
        .leftJoinAndSelect('usuario.rolPrincipal', 'rolPrincipal')
        .where('usuario.username = :username', { username })
        .getOne();

      this.logger.log(
        `[findByUsername] Usuario encontrado por username: ${user ? `ID ${user.id}` : 'null'}`,
      );

      // Si no se encuentra por username, intentar buscar por email
      if (!user) {
        this.logger.log(`[findByUsername] Intentando buscar por email...`);
        user = await this.userRepository
          .createQueryBuilder('usuario')
          .leftJoinAndSelect('usuario.persona', 'persona')
          .leftJoinAndSelect('usuario.rolPrincipal', 'rolPrincipal')
          .where('persona.email = :email', { email: username })
          .getOne();

        this.logger.log(
          `[findByUsername] Usuario encontrado por email: ${user ? `ID ${user.id}` : 'null'}`,
        );
      }

      // Si no se encuentra el usuario, retornar null
      if (!user) {
        this.logger.error(`[findByUsername] Usuario/Email '${username}' NO encontrado en la base de datos`);
        return null;
      }

      // Verificar que el usuario esté activo
      // MySQL almacena tinyint(1) como 0 o 1, TypeORM lo convierte a boolean
      // Convertir a número para comparación segura
      const usuarioActivoValue =
        typeof user.activo === 'boolean' ? (user.activo ? 1 : 0) : Number(user.activo);

      this.logger.log(
        `[findByUsername] Usuario activo: ${user.activo} (tipo: ${typeof user.activo}, valor numérico: ${usuarioActivoValue})`,
      );

      if (usuarioActivoValue !== 1) {
        this.logger.warn(
          `[findByUsername] Usuario '${username}' está inactivo (activo: ${user.activo})`,
        );
        return null;
      }

      // Verificar que la persona también esté activa
      if (user.persona) {
        const personaActivaValue =
          typeof user.persona.activo === 'boolean'
            ? (user.persona.activo ? 1 : 0)
            : Number(user.persona.activo);

        this.logger.log(
          `[findByUsername] Persona activa: ${user.persona.activo} (tipo: ${typeof user.persona.activo}, valor numérico: ${personaActivaValue})`,
        );

        if (personaActivaValue !== 1) {
          this.logger.warn(
            `[findByUsername] Persona del usuario '${username}' está inactiva (activo: ${user.persona.activo})`,
          );
          return null;
        }
      } else {
        // Si no hay persona asociada, retornar null
        this.logger.error(`[findByUsername] Usuario '${username}' no tiene persona asociada`);
        return null;
      }

      this.logger.log(`[findByUsername] Usuario '${username}' encontrado y validado correctamente`);
      return user;
    } catch (error) {
      this.logger.error(`[findByUsername] Error buscando usuario: ${error.message}`, error.stack);
      return null;
    }
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
    // Usar transacción para asegurar consistencia
    return await this.dataSource.transaction(async (manager) => {
      // 1. Buscar el rol
      const rol = await manager.findOne(Rol, {
        where: { codigo: rolCodigo, activo: true },
      });

      if (!rol) {
        throw new Error(
          `Rol con código ${rolCodigo} no encontrado. Asegúrate de que los roles estén creados en la base de datos.`,
        );
      }

      // 2. Crear Persona
      const persona = manager.create(Persona, {
        ...personaData,
        activo: true,
      });
      const savedPersona = await manager.save(Persona, persona);

      // 3. Crear Usuario
      const usuario = manager.create(Usuario, {
        persona: savedPersona,
        username: usuarioData.username,
        passwordHash: usuarioData.passwordHash,
        rolPrincipal: rol,
        activo: true,
      });
      const savedUsuario = await manager.save(Usuario, usuario);

      // 4. Crear PersonaRol (asignar rol a la persona)
      const personaRol = manager.create(PersonaRol, {
        persona: savedPersona,
        rol: rol,
        activo: true,
      });
      await manager.save(PersonaRol, personaRol);

      // 5. Crear registro específico según el rol
      if (rolCodigo === 'ALUMNO') {
        // Generar código de estudiante automático
        const codigoEstudiante = await this.generarCodigoEstudianteUnico(
          manager.getRepository(Alumno),
        );

        const alumno = manager.create(Alumno, {
          persona: savedPersona,
          codigoEstudiante,
          activo: true,
          fechaIngreso: new Date(),
        });
        await manager.save(Alumno, alumno);
      } else if (rolCodigo === 'INSTRUCTOR') {
        const instructor = manager.create(Instructor, {
          persona: savedPersona,
          activo: true,
        });
        await manager.save(Instructor, instructor);
      }

      // 6. Cargar relaciones para retornar
      return (await manager.findOne(Usuario, {
        where: { id: savedUsuario.id },
        relations: ['persona', 'rolPrincipal'],
      })) as Usuario;
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
      .where('alumno.codigoEstudiante LIKE :prefijo', { prefijo: `${prefijo}%` })
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
