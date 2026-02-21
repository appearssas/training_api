import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { IMaterialesRepository } from '@/domain/materiales/ports/materiales.repository.port';
import { CreateMaterialDto } from '@/application/materiales/dto/create-material.dto';
import { MaterialCapacitacion } from '@/entities/materiales/material-capacitacion.entity';
import { VideoUrlValidatorService } from '@/infrastructure/shared/services/video-url-validator.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoMaterial } from '@/entities/catalogos/tipo-material.entity';

@Injectable()
export class CreateMaterialUseCase {
  constructor(
    @Inject('IMaterialesRepository')
    private readonly materialesRepository: IMaterialesRepository,
    private readonly videoUrlValidator: VideoUrlValidatorService,
    @InjectRepository(TipoMaterial)
    private readonly tipoMaterialRepository: Repository<TipoMaterial>,
  ) {}

  async execute(
    createMaterialDto: CreateMaterialDto,
  ): Promise<MaterialCapacitacion> {
    // Validar que el tipo de material exista
    const tipoMaterial = await this.tipoMaterialRepository.findOne({
      where: { id: createMaterialDto.tipoMaterialId },
    });

    if (!tipoMaterial) {
      throw new BadRequestException(
        `Tipo de material con ID ${createMaterialDto.tipoMaterialId} no encontrado`,
      );
    }

    // Si es un video, validar la URL según RF-12, RF-13, RF-14
    const tipoMaterialCodigo = tipoMaterial.codigo?.toUpperCase();
    if (tipoMaterialCodigo === 'VIDEO' || tipoMaterialCodigo === 'VIDEO_URL') {
      this.videoUrlValidator.validateVideoUrl(createMaterialDto.url);
    }

    return this.materialesRepository.create(createMaterialDto);
  }
}
