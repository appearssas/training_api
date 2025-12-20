import {
  Injectable,
  Inject,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { IPersonasRepository } from '@/domain/personas/ports/personas.repository.port';
import { CreateConductorExternoDto } from '../dto/create-conductor-externo.dto';
import { TipoDocumento } from '@/entities/persona/types';

@Injectable()
export class CreateConductorExternoUseCase {
  constructor(
    @Inject('IPersonasRepository')
    private readonly personasRepository: IPersonasRepository,
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

    // Verificar que el email no esté en uso (si se proporciona)
    if (createConductorExternoDto.email) {
      const existingPersonaByEmail =
        await this.personasRepository.findByEmail(
          createConductorExternoDto.email,
        );
      if (existingPersonaByEmail) {
        throw new ConflictException('El email ya está registrado');
      }
    }

    // Preparar datos de persona
    const personaData = {
      numeroDocumento: createConductorExternoDto.numeroDocumento,
      tipoDocumento:
        createConductorExternoDto.tipoDocumento || TipoDocumento.CC,
      nombres: createConductorExternoDto.nombres,
      apellidos: createConductorExternoDto.apellidos,
      email: createConductorExternoDto.email || undefined,
      telefono: createConductorExternoDto.telefono || undefined,
      fechaNacimiento: createConductorExternoDto.fechaNacimiento
        ? new Date(createConductorExternoDto.fechaNacimiento)
        : undefined,
      genero: createConductorExternoDto.genero || undefined,
      direccion: createConductorExternoDto.direccion || undefined,
      activo: true,
    };

    // Crear conductor externo (persona + alumno externo, sin usuario)
    const result = await this.personasRepository.createConductorExterno(
      personaData,
    );

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

