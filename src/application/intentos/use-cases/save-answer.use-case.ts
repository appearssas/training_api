import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { IIntentosRepository } from '@/domain/intentos/ports/intentos.repository.port';
import { SubmitAnswerDto } from '../dto/submit-answer.dto';

/**
 * Caso de uso para guardar una respuesta del estudiante
 * Permite guardar respuestas durante el intento (auto-guardado)
 * Sigue el principio de Responsabilidad Única (SOLID)
 */
@Injectable()
export class SaveAnswerUseCase {
  constructor(
    @Inject('IIntentosRepository')
    private readonly intentosRepository: IIntentosRepository,
  ) {}

  async execute(intentoId: number, dto: SubmitAnswerDto): Promise<void> {
    // Validar que el intento existe y está en progreso
    const intento = await this.intentosRepository.getAttemptById(intentoId);
    if (!intento) {
      throw new NotFoundException(`Intento con ID ${intentoId} no encontrado`);
    }

    if (intento.estado !== 'en_progreso') {
      throw new BadRequestException(
        `No se puede guardar respuestas en un intento ${intento.estado}`,
      );
    }

    // Guardar la respuesta
    await this.intentosRepository.saveAnswer(intentoId, dto);
  }
}
