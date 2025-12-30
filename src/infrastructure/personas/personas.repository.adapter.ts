import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { IPersonasRepository } from '@/domain/personas/ports/personas.repository.port';
import { Persona } from '@/entities/persona/persona.entity';
import { Alumno } from '@/entities/alumnos/alumno.entity';
import { Usuario } from '@/entities/usuarios/usuario.entity';
import { Rol } from '@/entities/roles/rol.entity';
import {
  generarCodigoEstudiante,
  extraerNumeroSecuencial,
} from '@/infrastructure/shared/helpers/codigo-estudiante.helper';
import { hashPassword } from '@/infrastructure/shared/helpers/bcrypt.helper';
import { generarPasswordTemporal } from '@/infrastructure/shared/helpers/password-generator.helper';
import { sanitizePersonaData } from '@/infrastructure/shared/helpers/persona-sanitizer.helper';

@Injectable()
export class PersonasRepositoryAdapter implements IPersonasRepository {
  constructor(
    @InjectRepository(Persona)
    private readonly personaRepository: Repository<Persona>,
    @InjectRepository(Alumno)
    private readonly alumnoRepository: Repository<Alumno>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(Rol)
    private readonly rolRepository: Repository<Rol>,
    private readonly dataSource: DataSource,
  ) {}

  async findByNumeroDocumento(numeroDocumento: string): Promise<Persona | null> {
    return await this.personaRepository.findOne({
      where: { numeroDocumento },
    });
  }

  async findByEmail(email: string): Promise<Persona | null> {
    return await this.personaRepository.findOne({
      where: { email },
    });
  }

  async findById(id: number): Promise<Persona | null> {
    return await this.personaRepository.findOne({
      where: { id },
      relations: ['alumno', 'usuario'],
    });
  }

  async createConductorExterno(
    personaData: Partial<Persona>,
  ): Promise<{
    persona: Persona;
    alumno: Alumno;
    usuario: Usuario;
    passwordTemporal: string;
  }> {
    // Usar transacción para asegurar consistencia
    return await this.dataSource.transaction(async (manager) => {
      // 1. Buscar el rol ALUMNO
      const rolAlumno = await manager.findOne(Rol, {
        where: { codigo: 'ALUMNO', activo: true },
      });

      if (!rolAlumno) {
        throw new Error(
          'Rol ALUMNO no encontrado. Asegúrate de que los roles estén creados en la base de datos.',
        );
      }

      // 2. Crear Persona (sanitizar datos personales)
      const sanitizedPersonaData = sanitizePersonaData(personaData);
      const persona = manager.create(Persona, {
        ...sanitizedPersonaData,
        activo: true,
      });
      const savedPersona = await manager.save(Persona, persona);

      // 3. Crear Usuario con contraseña temporal
      // Generar un username único basado en el número de documento
      const username = `ext_${savedPersona.numeroDocumento}`;
      
      // Verificar que el username no exista (aunque es poco probable)
      let finalUsername = username;
      let counter = 1;
      while (
        await manager.findOne(Usuario, {
          where: { username: finalUsername },
        })
      ) {
        finalUsername = `${username}_${counter}`;
        counter++;
      }

      // Generar contraseña temporal segura
      const passwordTemporal = generarPasswordTemporal(12, 'TEMP_');
      const passwordHash = hashPassword(passwordTemporal);

      const usuario = manager.create(Usuario, {
        persona: savedPersona,
        username: finalUsername,
        passwordHash,
        rolPrincipal: rolAlumno,
        habilitado: false, // No habilitado hasta que se registre el pago
        activo: true,
        debeCambiarPassword: true, // Debe cambiar la contraseña en el primer login
      });
      const savedUsuario = await manager.save(Usuario, usuario);

      // 4. Generar código de estudiante automático
      const codigoEstudiante = await this.generarCodigoEstudianteUnico(
        manager.getRepository(Alumno),
      );

      // 5. Crear Alumno externo
      const alumno = manager.create(Alumno, {
        persona: savedPersona,
        codigoEstudiante,
        esExterno: true, // Marcar como externo
        activo: true,
        fechaIngreso: new Date(),
      });
      const savedAlumno = await manager.save(Alumno, alumno);

      // Retornar también la contraseña temporal para enviarla por email
      return {
        persona: savedPersona,
        alumno: savedAlumno,
        usuario: savedUsuario,
        passwordTemporal, // Incluir para enviar por email
      };
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

