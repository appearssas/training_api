import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Pago } from '@/entities/pagos/pago.entity';
import { IPagosRepository } from '@/domain/pagos/ports/pagos.repository.port';

@Injectable()
export class PagosRepositoryAdapter implements IPagosRepository {
  constructor(
    @InjectRepository(Pago)
    private readonly pagoRepository: Repository<Pago>,
    private readonly dataSource: DataSource,
  ) {}

  async create(pagoData: Partial<Pago>): Promise<Pago> {
    const pago = this.pagoRepository.create(pagoData);
    return await this.pagoRepository.save(pago);
  }

  async findById(id: number): Promise<Pago | null> {
    return await this.pagoRepository.findOne({
      where: { id },
    });
  }

  async findByEstudianteId(estudianteId: number): Promise<Pago[]> {
    return await this.pagoRepository.find({
      where: { estudiante: { id: estudianteId } },
      order: { fechaPago: 'DESC' },
    });
  }

  async findByIdWithRelations(id: number): Promise<Pago | null> {
    return await this.pagoRepository.findOne({
      where: { id },
      relations: ['estudiante', 'registradoPor', 'capacitacion'],
    });
  }
}

