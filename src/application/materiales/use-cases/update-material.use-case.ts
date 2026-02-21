import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { IMaterialesRepository } from '@/domain/materiales/ports/materiales.repository.port';
import { UpdateMaterialDto } from '@/application/materiales/dto/update-material.dto';
import { MaterialCapacitacion } from '@/entities/materiales/material-capacitacion.entity';
import { VideoUrlValidatorService } from '@/infrastructure/shared/services/video-url-validator.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoMaterial } from '@/entities/catalogos/tipo-material.entity';

@Injectable()
export class UpdateMaterialUseCase {
  constructor(
    @Inject('IMaterialesRepository')
    private readonly materialesRepository: IMaterialesRepository,
    private readonly videoUrlValidator: VideoUrlValidatorService,
    @InjectRepository(TipoMaterial)
    private readonly tipoMaterialRepository: Repository<TipoMaterial>,
  ) {}

  async execute(
    id: number,
    updateMaterialDto: UpdateMaterialDto,
  ): Promise<MaterialCapacitacion> {
    // Verificar que el material exista
    const material = await this.materialesRepository.findOne(id);
    if (!material) {
      throw new NotFoundException(`Material con ID ${id} no encontrado`);
    }

    // Si se actualiza el tipo de material, validar que exista
    if (updateMaterialDto.tipoMaterialId) {
      const tipoMaterial = await this.tipoMaterialRepository.findOne({
        where: { id: updateMaterialDto.tipoMaterialId },
      });

      if (!tipoMaterial) {
        throw new BadRequestException(
          `Tipo de material con ID ${updateMaterialDto.tipoMaterialId} no encontrado`,
        );
      }

      // Si el nuevo tipo es video y hay URL, validarla
      const tipoMaterialCodigo = tipoMaterial.codigo?.toUpperCase();
      if (
        (tipoMaterialCodigo === 'VIDEO' ||
          tipoMaterialCodigo === 'VIDEO_URL') &&
        updateMaterialDto.url
      ) {
        this.videoUrlValidator.validateVideoUrl(updateMaterialDto.url);
      }
    } else if (updateMaterialDto.url) {
      // Si solo se actualiza la URL, verificar el tipo actual del material
      const materialCompleto = await this.materialesRepository.findOne(id);
      if (materialCompleto?.tipoMaterial) {
        const tipoMaterialCodigo =
          materialCompleto.tipoMaterial.codigo?.toUpperCase();
        if (
          tipoMaterialCodigo === 'VIDEO' ||
          tipoMaterialCodigo === 'VIDEO_URL'
        ) {
          this.videoUrlValidator.validateVideoUrl(updateMaterialDto.url);
        }
      }
    }

    return this.materialesRepository.update(id, updateMaterialDto);
  }
}
