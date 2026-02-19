import { Pago } from '@/entities/pagos/pago.entity';

export interface IPagosRepository {
  create(pagoData: Partial<Pago>): Promise<Pago>;
  findById(id: number): Promise<Pago | null>;
  findByEstudianteId(estudianteId: number): Promise<Pago[]>;
  findByIdWithRelations(id: number): Promise<Pago | null>;
}
