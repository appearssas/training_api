import {
  Injectable,
  Inject,
  BadRequestException,
  PayloadTooLargeException,
  Logger,
} from '@nestjs/common';
import { PassThrough } from 'stream';
import * as ExcelJS from 'exceljs';
import { IUsuariosRepository } from '@/domain/usuarios/ports/usuarios.repository.port';
import { Usuario } from '@/entities/usuarios/usuario.entity';
import {
  ExportUsersQueryDto,
  ExportScope,
  ExportFormat,
  EXPORT_BATCH_SIZE,
  EXPORT_PAGE_MAX_LIMIT,
} from '../dto/export-users.query.dto';
import { UserSortField, SortOrder } from '../dto/list-users.dto';
import { buildAttachmentContentDisposition } from '../utils/content-disposition.util';
import {
  USUARIO_EXPORT_HEADERS,
  csvEscapeCell,
  usuarioToExportRow,
} from '../utils/usuario-export.mapper';
import { EXPORT_ALL_MAX_BATCH_ITERATIONS } from '../constants/users-export.constants';

export interface ExportUsersResult {
  stream: PassThrough;
  contentType: string;
  filename: string;
  contentDisposition: string;
}

@Injectable()
export class ExportUsersUseCase {
  private readonly logger = new Logger(ExportUsersUseCase.name);

  constructor(
    @Inject('IUsuariosRepository')
    private readonly usuariosRepository: IUsuariosRepository,
  ) {}

  execute(dto: ExportUsersQueryDto, currentUser?: Usuario): ExportUsersResult {
    if (dto.scope === ExportScope.PAGE) {
      if (dto.page == null || dto.limit == null) {
        throw new BadRequestException(
          'Con scope=page debe enviar page y limit (1 ≤ limit ≤ ' +
            EXPORT_PAGE_MAX_LIMIT +
            ').',
        );
      }
      if (dto.limit > EXPORT_PAGE_MAX_LIMIT) {
        throw new BadRequestException(
          `limit no puede superar ${EXPORT_PAGE_MAX_LIMIT}`,
        );
      }
    }

    const sortBy = dto.sortBy ?? UserSortField.FECHA_CREACION;
    const sortOrder = dto.sortOrder ?? SortOrder.DESC;

    let empresaId: number | undefined;
    if (
      currentUser?.rolPrincipal?.codigo === 'CLIENTE' &&
      currentUser?.persona?.empresaId
    ) {
      empresaId = currentUser.persona.empresaId;
    }

    const listFilters = {
      search: dto.search,
      role: dto.role,
      habilitado: dto.habilitado,
      activo: dto.activo,
      sortBy,
      sortOrder,
      empresaId,
    };

    const keysetFilters = {
      search: dto.search,
      role: dto.role,
      habilitado: dto.habilitado,
      activo: dto.activo,
      empresaId,
    };

    const pass = new PassThrough();
    const format = dto.format ?? ExportFormat.XLSX;
    const dateStr = new Date().toISOString().split('T')[0];
    const ext = format === ExportFormat.CSV ? 'csv' : 'xlsx';
    const filename = `usuarios_${dto.scope}_${dateStr}.${ext}`;
    const contentType =
      format === ExportFormat.CSV
        ? 'text/csv; charset=utf-8'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const contentDisposition = buildAttachmentContentDisposition(filename);

    this.logger.log(
      `users_export_started actorId=${currentUser?.id ?? 'n/a'} username=${currentUser?.username ?? 'n/a'} scope=${dto.scope} format=${format} hasSearch=${Boolean(dto.search)} role=${dto.role ?? '-'} habilitado=${dto.habilitado === undefined ? '-' : dto.habilitado} activo=${dto.activo === undefined ? '-' : dto.activo}`,
    );

    if (format === ExportFormat.CSV) {
      void this.pipeCsv(pass, dto, listFilters, keysetFilters);
    } else {
      void this.pipeXlsx(pass, dto, listFilters, keysetFilters);
    }

    return { stream: pass, contentType, filename, contentDisposition };
  }

  private async pipeCsv(
    pass: PassThrough,
    dto: ExportUsersQueryDto,
    listFilters: {
      search?: string;
      role?: string;
      habilitado?: boolean;
      activo?: boolean;
      sortBy: UserSortField;
      sortOrder: SortOrder;
      empresaId?: number;
    },
    keysetFilters: {
      search?: string;
      role?: string;
      habilitado?: boolean;
      activo?: boolean;
      empresaId?: number;
    },
  ): Promise<void> {
    try {
      pass.write('\uFEFF');
      pass.write(
        [...USUARIO_EXPORT_HEADERS].map(h => csvEscapeCell(h)).join(',') + '\n',
      );

      if (dto.scope === ExportScope.PAGE) {
        const page = dto.page ?? 1;
        const limit = dto.limit ?? 10;
        const { usuarios } = await this.usuariosRepository.findAll({
          ...listFilters,
          page,
          limit,
        });
        for (const u of usuarios) {
          pass.write(usuarioToExportRow(u).map(csvEscapeCell).join(',') + '\n');
        }
      } else {
        let afterId = 0;
        let iterations = 0;
        while (true) {
          if (++iterations > EXPORT_ALL_MAX_BATCH_ITERATIONS) {
            pass.destroy(
              new PayloadTooLargeException(
                'La exportación supera el máximo de filas permitido. Refine los filtros o contacte al administrador.',
              ),
            );
            return;
          }
          const usuarios = await this.usuariosRepository.findAllForExportKeyset(
            keysetFilters,
            afterId,
            EXPORT_BATCH_SIZE,
          );
          if (usuarios.length === 0) break;
          for (const u of usuarios) {
            pass.write(
              usuarioToExportRow(u).map(csvEscapeCell).join(',') + '\n',
            );
          }
          const last = usuarios[usuarios.length - 1];
          afterId = last.id;
          if (usuarios.length < EXPORT_BATCH_SIZE) break;
        }
      }
      pass.end();
    } catch (err) {
      pass.destroy(err instanceof Error ? err : new Error(String(err)));
    }
  }

  private async pipeXlsx(
    pass: PassThrough,
    dto: ExportUsersQueryDto,
    listFilters: {
      search?: string;
      role?: string;
      habilitado?: boolean;
      activo?: boolean;
      sortBy: UserSortField;
      sortOrder: SortOrder;
      empresaId?: number;
    },
    keysetFilters: {
      search?: string;
      role?: string;
      habilitado?: boolean;
      activo?: boolean;
      empresaId?: number;
    },
  ): Promise<void> {
    try {
      const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
        stream: pass,
        useStyles: false,
        useSharedStrings: false,
      });
      const sheet = workbook.addWorksheet('Usuarios', {
        views: [{ state: 'frozen', ySplit: 1 }],
      });
      const headerRow = sheet.addRow([...USUARIO_EXPORT_HEADERS]);
      headerRow.commit();

      const writeUsers = (usuarios: Usuario[]) => {
        for (const u of usuarios) {
          const row = sheet.addRow(usuarioToExportRow(u));
          row.commit();
        }
      };

      if (dto.scope === ExportScope.PAGE) {
        const page = dto.page ?? 1;
        const limit = dto.limit ?? 10;
        const { usuarios } = await this.usuariosRepository.findAll({
          ...listFilters,
          page,
          limit,
        });
        writeUsers(usuarios);
      } else {
        let afterId = 0;
        let iterations = 0;
        while (true) {
          if (++iterations > EXPORT_ALL_MAX_BATCH_ITERATIONS) {
            pass.destroy(
              new PayloadTooLargeException(
                'La exportación supera el máximo de filas permitido. Refine los filtros o contacte al administrador.',
              ),
            );
            return;
          }
          const usuarios = await this.usuariosRepository.findAllForExportKeyset(
            keysetFilters,
            afterId,
            EXPORT_BATCH_SIZE,
          );
          if (usuarios.length === 0) break;
          writeUsers(usuarios);
          const last = usuarios[usuarios.length - 1];
          afterId = last.id;
          if (usuarios.length < EXPORT_BATCH_SIZE) break;
        }
      }

      await workbook.commit();
    } catch (err) {
      pass.destroy(err instanceof Error ? err : new Error(String(err)));
    }
  }
}
