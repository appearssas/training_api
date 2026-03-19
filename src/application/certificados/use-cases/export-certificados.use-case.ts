import {
  Injectable,
  Inject,
  BadRequestException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { PassThrough } from 'stream';
import * as ExcelJS from 'exceljs';
import {
  ICertificadosRepository,
  CertificadosUserContext,
} from '@/domain/certificados/ports/certificados.repository.port';
import {
  PaginationDto,
  SortOrder,
} from '@/application/shared/dto/pagination.dto';
import {
  ExportCertificadosQueryDto,
  ExportCertificatesFormat,
  ExportCertificatesScope,
  EXPORT_CERTIFICATES_BATCH_SIZE,
  EXPORT_CERTIFICATES_PAGE_MAX_LIMIT,
} from '../dto/export-certificados.query.dto';
import { buildAttachmentContentDisposition } from '@/application/usuarios/utils/content-disposition.util';
import {
  CERTIFICADO_EXPORT_HEADERS,
  certificadoToExportRow,
  csvEscapeCell,
} from '../utils/certificado-export.mapper';
import { EXPORT_CERTIFICATES_MAX_BATCH_ITERATIONS } from '../constants/certificados-export.constants';

export interface ExportCertificatesResult {
  stream: PassThrough;
  contentType: string;
  contentDisposition: string;
}

@Injectable()
export class ExportCertificadosUseCase {
  constructor(
    @Inject('ICertificadosRepository')
    private readonly certificadosRepository: ICertificadosRepository,
  ) {}

  execute(
    dto: ExportCertificadosQueryDto,
    userContext: CertificadosUserContext,
  ): ExportCertificatesResult {
    if (dto.scope === ExportCertificatesScope.PAGE) {
      if (dto.page == null || dto.limit == null) {
        throw new BadRequestException(
          `Con scope=page debe enviar page y limit (max ${EXPORT_CERTIFICATES_PAGE_MAX_LIMIT}).`,
        );
      }
      if (dto.limit > EXPORT_CERTIFICATES_PAGE_MAX_LIMIT) {
        throw new BadRequestException(
          `limit no puede superar ${EXPORT_CERTIFICATES_PAGE_MAX_LIMIT}`,
        );
      }
    }

    const pass = new PassThrough();
    const format = dto.format ?? ExportCertificatesFormat.XLSX;
    const ext = format === ExportCertificatesFormat.CSV ? 'csv' : 'xlsx';
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `certificados_${dto.scope}_${dateStr}.${ext}`;

    const basePagination: PaginationDto = {
      page: dto.page ?? 1,
      limit: dto.limit ?? 10,
      search: dto.search,
      sortField: dto.sortField ?? 'id',
      sortOrder: dto.sortOrder ?? SortOrder.DESC,
      filters: {
        ...(dto.courseId ? { courseId: dto.courseId } : {}),
        ...(dto.status ? { status: dto.status } : {}),
      },
    };

    if (format === ExportCertificatesFormat.CSV) {
      void this.pipeCsv(pass, dto, basePagination, userContext);
    } else {
      void this.pipeXlsx(pass, dto, basePagination, userContext);
    }

    return {
      stream: pass,
      contentType:
        format === ExportCertificatesFormat.CSV
          ? 'text/csv; charset=utf-8'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      contentDisposition: buildAttachmentContentDisposition(filename),
    };
  }

  private async pipeCsv(
    pass: PassThrough,
    dto: ExportCertificadosQueryDto,
    basePagination: PaginationDto,
    userContext: CertificadosUserContext,
  ): Promise<void> {
    try {
      pass.write('\uFEFF');
      pass.write(
        [...CERTIFICADO_EXPORT_HEADERS].map(h => csvEscapeCell(h)).join(',') +
          '\n',
      );

      if (dto.scope === ExportCertificatesScope.PAGE) {
        const result = await this.certificadosRepository.findAll(
          basePagination,
          userContext,
        );
        for (const cert of result.data) {
          pass.write(
            certificadoToExportRow(cert).map(csvEscapeCell).join(',') + '\n',
          );
        }
      } else {
        let afterId = 0;
        let iterations = 0;
        while (true) {
          if (++iterations > EXPORT_CERTIFICATES_MAX_BATCH_ITERATIONS) {
            pass.destroy(
              new PayloadTooLargeException(
                'La exportacion supera el maximo permitido. Refine los filtros.',
              ),
            );
            return;
          }
          const rows = await this.certificadosRepository.findAllForExportKeyset(
            {
              search: basePagination.search,
              sortField: 'id',
              sortOrder: SortOrder.ASC,
              filters: basePagination.filters,
            },
            afterId,
            EXPORT_CERTIFICATES_BATCH_SIZE,
            userContext,
          );
          if (rows.length === 0) break;
          for (const cert of rows) {
            pass.write(
              certificadoToExportRow(cert).map(csvEscapeCell).join(',') + '\n',
            );
          }
          afterId = rows[rows.length - 1].id;
          if (rows.length < EXPORT_CERTIFICATES_BATCH_SIZE) break;
        }
      }

      pass.end();
    } catch (err) {
      pass.destroy(err instanceof Error ? err : new Error(String(err)));
    }
  }

  private async pipeXlsx(
    pass: PassThrough,
    dto: ExportCertificadosQueryDto,
    basePagination: PaginationDto,
    userContext: CertificadosUserContext,
  ): Promise<void> {
    try {
      const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
        stream: pass,
        useStyles: false,
        useSharedStrings: false,
      });
      const sheet = workbook.addWorksheet('Certificados', {
        views: [{ state: 'frozen', ySplit: 1 }],
      });
      sheet.addRow([...CERTIFICADO_EXPORT_HEADERS]).commit();

      const writeRows = (rows: any[]) => {
        for (const cert of rows) {
          sheet.addRow(certificadoToExportRow(cert)).commit();
        }
      };

      if (dto.scope === ExportCertificatesScope.PAGE) {
        const result = await this.certificadosRepository.findAll(
          basePagination,
          userContext,
        );
        writeRows(result.data);
      } else {
        let afterId = 0;
        let iterations = 0;
        while (true) {
          if (++iterations > EXPORT_CERTIFICATES_MAX_BATCH_ITERATIONS) {
            pass.destroy(
              new PayloadTooLargeException(
                'La exportacion supera el maximo permitido. Refine los filtros.',
              ),
            );
            return;
          }
          const rows = await this.certificadosRepository.findAllForExportKeyset(
            {
              search: basePagination.search,
              sortField: 'id',
              sortOrder: SortOrder.ASC,
              filters: basePagination.filters,
            },
            afterId,
            EXPORT_CERTIFICATES_BATCH_SIZE,
            userContext,
          );
          if (rows.length === 0) break;
          writeRows(rows);
          afterId = rows[rows.length - 1].id;
          if (rows.length < EXPORT_CERTIFICATES_BATCH_SIZE) break;
        }
      }

      await workbook.commit();
    } catch (err) {
      pass.destroy(err instanceof Error ? err : new Error(String(err)));
    }
  }
}
