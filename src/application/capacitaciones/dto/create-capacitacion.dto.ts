import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  IsEnum,
  IsInt,
  Min,
  Max,
  Length,
} from 'class-validator';
import { EstadoCapacitacion } from '@/entities/capacitacion/types';

export class CreateCapacitacionDto {
  @IsString()
  @Length(1, 500)
  titulo: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsInt()
  tipoCapacitacionId: number;

  @IsInt()
  modalidadId: number;

  @IsInt()
  instructorId: number;

  @IsOptional()
  @IsInt()
  areaId?: number;

  @IsOptional()
  @IsString()
  @Length(0, 200)
  publicoObjetivo?: string;

  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  duracionHoras?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacidadMaxima?: number;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  imagenPortadaUrl?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  videoPromocionalUrl?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minimoAprobacion?: number;

  @IsOptional()
  @IsEnum(EstadoCapacitacion)
  estado?: EstadoCapacitacion;
}
