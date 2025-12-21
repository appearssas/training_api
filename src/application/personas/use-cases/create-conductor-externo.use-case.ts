import {
  Injectable,
  Inject,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { IPersonasRepository } from '@/domain/personas/ports/personas.repository.port';
import { CreateConductorExternoDto } from '../dto/create-conductor-externo.dto';
import { TipoDocumento } from '@/entities/persona/types';
import { EmailService } from '@/infrastructure/shared/services/email.service';

@Injectable()
export class CreateConductorExternoUseCase {
  private readonly logger = new Logger(CreateConductorExternoUseCase.name);

  constructor(
    @Inject('IPersonasRepository')
    private readonly personasRepository: IPersonasRepository,
    private readonly emailService: EmailService,
  ) {}

  async execute(
    createConductorExternoDto: CreateConductorExternoDto,
  ): Promise<{ persona: any; alumno: any }> {
    // Validar datos obligatorios
    if (!createConductorExternoDto.numeroDocumento) {
      throw new BadRequestException('El número de documento es obligatorio');
    }

    if (!createConductorExternoDto.tipoDocumento) {
      throw new BadRequestException('El tipo de documento es obligatorio');
    }

    if (!createConductorExternoDto.nombres) {
      throw new BadRequestException('Los nombres son obligatorios');
    }

    if (!createConductorExternoDto.apellidos) {
      throw new BadRequestException('Los apellidos son obligatorios');
    }

    if (!createConductorExternoDto.email) {
      throw new BadRequestException('El email es obligatorio para enviar las credenciales de acceso');
    }

    // Verificar que el número de documento no esté en uso
    const existingPersonaByDoc =
      await this.personasRepository.findByNumeroDocumento(
        createConductorExternoDto.numeroDocumento,
      );
    if (existingPersonaByDoc) {
      throw new ConflictException(
        'El número de documento ya está registrado',
      );
    }

    // Verificar que el email no esté en uso
    const existingPersonaByEmail =
      await this.personasRepository.findByEmail(
        createConductorExternoDto.email,
      );
    if (existingPersonaByEmail) {
      throw new ConflictException('El email ya está registrado');
    }

    // Preparar datos de persona
    const personaData = {
      numeroDocumento: createConductorExternoDto.numeroDocumento,
      tipoDocumento:
        createConductorExternoDto.tipoDocumento || TipoDocumento.CC,
      nombres: createConductorExternoDto.nombres,
      apellidos: createConductorExternoDto.apellidos,
      email: createConductorExternoDto.email,
      telefono: createConductorExternoDto.telefono || undefined,
      fechaNacimiento: createConductorExternoDto.fechaNacimiento
        ? new Date(createConductorExternoDto.fechaNacimiento)
        : undefined,
      genero: createConductorExternoDto.genero || undefined,
      direccion: createConductorExternoDto.direccion || undefined,
      activo: true,
    };

    // Crear conductor externo (persona + alumno + usuario con contraseña temporal)
    const result = await this.personasRepository.createConductorExterno(
      personaData,
    );

    // Enviar email con credenciales temporales
    try {
      const nombreCompleto = `${result.persona.nombres} ${result.persona.apellidos}`;
      await this.emailService.enviarCredencialesTemporales(
        result.persona.email,
        nombreCompleto,
        result.usuario.username,
        result.passwordTemporal,
      );
      this.logger.log(
        `Credenciales temporales enviadas a ${result.persona.email}`,
      );
    } catch (error) {
      // No fallar la creación si el email falla, solo loguear
      // En producción, podrías querer lanzar un error o notificar al admin
      this.logger.error(
        `Error enviando email a ${result.persona.email}: ${error.message}`,
      );
      this.logger.warn(
        `Credenciales generadas pero no enviadas por email. Username: ${result.usuario.username}, Password: ${result.passwordTemporal}`,
      );
    }

    return {
      persona: {
        id: result.persona.id,
        numeroDocumento: result.persona.numeroDocumento,
        tipoDocumento: result.persona.tipoDocumento,
        nombres: result.persona.nombres,
        apellidos: result.persona.apellidos,
        email: result.persona.email,
        telefono: result.persona.telefono,
        fechaNacimiento: result.persona.fechaNacimiento,
        genero: result.persona.genero,
        direccion: result.persona.direccion,
        activo: result.persona.activo,
        fechaCreacion: result.persona.fechaCreacion,
      },
      alumno: {
        id: result.alumno.id,
        codigoEstudiante: result.alumno.codigoEstudiante,
        esExterno: result.alumno.esExterno,
        fechaIngreso: result.alumno.fechaIngreso,
        activo: result.alumno.activo,
        fechaCreacion: result.alumno.fechaCreacion,
      },
    };
  }
}

