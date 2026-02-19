import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IResenasRepository } from '@/domain/resenas/ports/resenas.repository.port';
import { Resena } from '@/entities/resenas/resena.entity';
import { CreateResenaDto } from '@/application/resenas/dto/create-resena.dto';

/**
 * Adaptador del repositorio de Reseñas
 * Implementa IResenasRepository usando TypeORM
 */
@Injectable()
export class ResenasRepositoryAdapter implements IResenasRepository {
  constructor(
    @InjectRepository(Resena)
    private readonly resenaRepository: Repository<Resena>,
  ) {}

  async create(createResenaDto: CreateResenaDto): Promise<Resena> {
    try {
      const resenaData = {
        inscripcion: { id: createResenaDto.inscripcionId } as any,
        calificacion: createResenaDto.calificacion,
        comentario: createResenaDto.comentario || undefined,
        activo: true,
      };

      const newResena = this.resenaRepository.create(resenaData);
      const savedResena = await this.resenaRepository.save(newResena);

      // Retornar la reseña con sus relaciones
      // savedResena es un objeto único (no un array) ya que save() recibe un objeto único
      const resenaId = Array.isArray(savedResena)
        ? savedResena[0].id
        : savedResena.id;
      return this.findOne(resenaId) as Promise<Resena>;
    } catch (error: unknown) {
      console.error('Error creating resena:', error);
      throw new InternalServerErrorException('Error al crear la reseña');
    }
  }

  async findOne(id: number): Promise<Resena | null> {
    try {
      return await this.resenaRepository.findOne({
        where: { id },
        relations: [
          'inscripcion',
          'inscripcion.capacitacion',
          'inscripcion.estudiante',
        ],
      });
    } catch (error: unknown) {
      console.error('Error fetching resena:', error);
      throw new InternalServerErrorException('Error al obtener la reseña');
    }
  }

  async findByInscripcion(inscripcionId: number): Promise<Resena | null> {
    try {
      return await this.resenaRepository.findOne({
        where: { inscripcion: { id: inscripcionId } },
        relations: [
          'inscripcion',
          'inscripcion.capacitacion',
          'inscripcion.estudiante',
        ],
      });
    } catch (error: unknown) {
      console.error('Error fetching resena by inscripcion:', error);
      throw new InternalServerErrorException(
        'Error al obtener la reseña por inscripción',
      );
    }
  }

  async existsByInscripcion(inscripcionId: number): Promise<boolean> {
    try {
      const count = await this.resenaRepository.count({
        where: { inscripcion: { id: inscripcionId } },
      });
      return count > 0;
    } catch (error: unknown) {
      console.error('Error checking resena existence:', error);
      throw new InternalServerErrorException(
        'Error al verificar la existencia de la reseña',
      );
    }
  }
}
