import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import { CreateConductorExternoDto } from '../dto/create-conductor-externo.dto';
import { CargaMasivaResponseDto } from '../dto/carga-masiva-response.dto';
import { CreateConductorExternoUseCase } from './create-conductor-externo.use-case';

interface FilaCSV {
  numeroDocumento: string;
  tipoDocumento?: string;
  nombres: string;
  apellidos: string;
  email?: string;
  telefono?: string;
  fechaNacimiento?: string;
  genero?: string;
  direccion?: string;
}

@Injectable()
export class CargaMasivaConductoresUseCase {
  private readonly logger = new Logger(CargaMasivaConductoresUseCase.name);

  constructor(
    private readonly createConductorExternoUseCase: CreateConductorExternoUseCase,
  ) {}

  async execute(fileBuffer: Buffer): Promise<CargaMasivaResponseDto> {
    // Validar que el archivo no esté vacío
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new BadRequestException('El archivo CSV está vacío');
    }

    // Parsear el CSV
    let filas: any[];
    try {
      filas = parse(fileBuffer.toString('utf-8'), {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true, // Soporta BOM para UTF-8
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(
        `Error al parsear el archivo CSV: ${message}`,
      );
    }

    // Validar que hay filas
    if (!filas || filas.length === 0) {
      throw new BadRequestException(
        'El archivo CSV no contiene datos o el formato es incorrecto',
      );
    }

    // Validar columnas requeridas
    const columnasRequeridas = ['numeroDocumento', 'nombres', 'apellidos'];
    const columnasDisponibles = Object.keys(filas[0] || {});

    const columnasFaltantes = columnasRequeridas.filter(
      col => !columnasDisponibles.includes(col),
    );

    if (columnasFaltantes.length > 0) {
      throw new BadRequestException(
        `El archivo CSV debe contener las siguientes columnas: ${columnasRequeridas.join(', ')}. Faltan: ${columnasFaltantes.join(', ')}`,
      );
    }

    // Procesar cada fila
    const errores: Array<{ fila: number; error: string; datos: any }> = [];
    let registradosExitosos = 0;

    for (let i = 0; i < filas.length; i++) {
      const fila = filas[i];
      const numeroFila = i + 2; // +2 porque la fila 1 es el encabezado y el índice empieza en 0

      try {
        // Validar datos de la fila
        this.validarFila(fila as FilaCSV);

        // Preparar DTO para crear conductor externo
        const dto: CreateConductorExternoDto = {
          numeroDocumento: fila.numeroDocumento.trim(),
          tipoDocumento: fila.tipoDocumento?.trim() || 'CC',
          nombres: fila.nombres.trim(),
          apellidos: fila.apellidos.trim(),
          email: fila.email?.trim() || undefined,
          telefono: fila.telefono?.trim() || undefined,
          fechaNacimiento: fila.fechaNacimiento?.trim() || undefined,
          genero: fila.genero?.trim() || undefined,
          direccion: fila.direccion?.trim() || undefined,
        };

        // Crear conductor externo
        await this.createConductorExternoUseCase.execute(dto);
        registradosExitosos++;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        const stack = error instanceof Error ? error.stack : undefined;
        this.logger.error(`Error en fila ${numeroFila}: ${msg}`, stack);
        errores.push({
          fila: numeroFila,
          error: msg || 'Error desconocido',
          datos: fila,
        });
      }
    }

    return {
      totalFilas: filas.length,
      registradosExitosos,
      filasConErrores: errores.length,
      errores,
    };
  }

  private validarFila(fila: FilaCSV): void {
    // Validar campos obligatorios
    if (!fila.numeroDocumento || !String(fila.numeroDocumento).trim()) {
      throw new Error('El número de documento es obligatorio');
    }

    if (!fila.nombres || !String(fila.nombres).trim()) {
      throw new Error('Los nombres son obligatorios');
    }

    if (!fila.apellidos || !String(fila.apellidos).trim()) {
      throw new Error('Los apellidos son obligatorios');
    }

    // Validar formato de email si está presente
    if (fila.email && String(fila.email).trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(String(fila.email).trim())) {
        throw new Error('El formato del email es inválido');
      }
    }

    // Validar formato de fecha si está presente
    if (fila.fechaNacimiento && String(fila.fechaNacimiento).trim()) {
      const fecha = new Date(String(fila.fechaNacimiento).trim());
      if (isNaN(fecha.getTime())) {
        throw new Error(
          'El formato de la fecha de nacimiento es inválido (use YYYY-MM-DD)',
        );
      }
    }
  }
}
