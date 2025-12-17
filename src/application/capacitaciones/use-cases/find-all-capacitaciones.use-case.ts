import { Injectable, Inject } from '@nestjs/common';
import { ICapacitacionesRepository } from '@/domain/capacitaciones/ports/capacitaciones.repository.port';
import { PaginationDto } from '@/application/shared/dto/pagination.dto';

@Injectable()
export class FindAllCapacitacionesUseCase {
  constructor(
    @Inject('ICapacitacionesRepository')
    private readonly capacitacionesRepository: ICapacitacionesRepository,
  ) {}

  async execute(pagination: PaginationDto): Promise<any> {
    return this.capacitacionesRepository.findAll(pagination);
  }
}
