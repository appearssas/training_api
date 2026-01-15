import { Injectable, Inject, BadRequestException, ConflictException } from '@nestjs/common';
import { IResenasRepository } from '@/domain/resenas/ports/resenas.repository.port';
import { CreateResenaDto } from '@/application/resenas/dto/create-resena.dto';
import { Resena } from '@/entities/resenas/resena.entity';
import { IInscripcionesRepository } from '@/domain/inscripciones/ports/inscripciones.repository.port';

/**
 * Caso de uso: Crear una nueva reseña
 * 
 * Reglas de negocio aplicadas:
 * - Valida que la inscripción exista
 * - Valida que no exista una reseña duplicada para la misma inscripción
 * - Valida que la calificación esté en el rango 1-5
 */
@Injectable()
export class CreateResenaUseCase {
  constructor(
    @Inject('IResenasRepository')
    private readonly resenasRepository: IResenasRepository,
    @Inject('IInscripcionesRepository')
    private readonly inscripcionesRepository: IInscripcionesRepository,
  ) {}

  async execute(createResenaDto: CreateResenaDto): Promise<Resena> {
    // 1. Validar que la inscripción existe
    const inscripcion = await this.inscripcionesRepository.findOne(
      createResenaDto.inscripcionId,
    );
    if (!inscripcion) {
      throw new BadRequestException(
        `Inscripción con ID ${createResenaDto.inscripcionId} no encontrada`,
      );
    }

    // 2. Validar que no exista una reseña duplicada para esta inscripción
    const existeResena = await this.resenasRepository.existsByInscripcion(
      createResenaDto.inscripcionId,
    );
    if (existeResena) {
      throw new ConflictException(
        'Ya existe una reseña para esta inscripción. Solo se permite una reseña por inscripción.',
      );
    }

    // 3. Crear la reseña
    return this.resenasRepository.create(createResenaDto);
  }
}
