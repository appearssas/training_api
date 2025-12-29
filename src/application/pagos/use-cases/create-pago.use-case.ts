import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { IPagosRepository } from '@/domain/pagos/ports/pagos.repository.port';
import { IPersonasRepository } from '@/domain/personas/ports/personas.repository.port';
import { CreatePagoDto } from '../dto/create-pago.dto';
import { PagoResponseDto } from '../dto/pago-response.dto';
import { Usuario } from '@/entities/usuarios/usuario.entity';

@Injectable()
export class CreatePagoUseCase {
  constructor(
    @Inject('IPagosRepository')
    private readonly pagosRepository: IPagosRepository,
    @Inject('IPersonasRepository')
    private readonly personasRepository: IPersonasRepository,
  ) {}

  async execute(
    createPagoDto: CreatePagoDto,
    usuarioRegistrador: Usuario,
  ): Promise<PagoResponseDto> {
    // Verificar que el estudiante existe
    const estudiante = await this.personasRepository.findById(
      createPagoDto.estudianteId,
    );

    if (!estudiante) {
      throw new NotFoundException(
        `No se encontró el estudiante con ID ${createPagoDto.estudianteId}`,
      );
    }

    // Verificar que el estudiante es un conductor externo
    if (!estudiante.alumno || !estudiante.alumno.esExterno) {
      throw new BadRequestException(
        'Solo se pueden registrar pagos para conductores externos',
      );
    }

    // Preparar datos del pago
    const pagoData = {
      estudiante: estudiante,
      monto: createPagoDto.monto,
      metodoPago: createPagoDto.metodoPago,
      numeroComprobante: createPagoDto.numeroComprobante || undefined,
      fechaPago: createPagoDto.fechaPago
        ? new Date(createPagoDto.fechaPago)
        : new Date(),
      registradoPor: usuarioRegistrador,
      observaciones: createPagoDto.observaciones || undefined,
      activo: true,
    };

    // Crear el pago
    const pago = await this.pagosRepository.create(pagoData);

    // Retornar respuesta
    return {
      id: pago.id,
      estudianteId: pago.estudiante.id,
      monto: Number(pago.monto),
      metodoPago: pago.metodoPago,
      numeroComprobante: pago.numeroComprobante,
      fechaPago: pago.fechaPago,
      registradoPorId: pago.registradoPor.id,
      observaciones: pago.observaciones,
      fechaCreacion: pago.fechaCreacion,
    };
  }
}
