import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { Genero } from '@/entities/persona/types';

export enum TipoRegistro {
  ALUMNO = 'ALUMNO',
  INSTRUCTOR = 'INSTRUCTOR',
}

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  numeroDocumento: string;

  @IsString()
  @IsOptional()
  tipoDocumento?: string;

  @IsString()
  @IsNotEmpty()
  nombres: string;

  @IsString()
  @IsNotEmpty()
  apellidos: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsDateString()
  @IsOptional()
  fechaNacimiento?: string;

  @IsEnum(Genero)
  @IsOptional()
  genero?: Genero;

  @IsString()
  @IsOptional()
  direccion?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsEnum(TipoRegistro)
  @IsNotEmpty()
  tipoRegistro: TipoRegistro;

  // Campos específicos para ALUMNO
  @IsString()
  @IsOptional()
  codigoEstudiante?: string;

  // Campos específicos para INSTRUCTOR
  @IsString()
  @IsOptional()
  especialidad?: string;

  @IsString()
  @IsOptional()
  biografia?: string;
}
