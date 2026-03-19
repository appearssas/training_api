import { EXPORT_CERTIFICATES_BATCH_SIZE } from '../dto/export-certificados.query.dto';

export const EXPORT_CERTIFICATES_MAX_BATCH_ITERATIONS = Math.max(
  1,
  Math.ceil(
    Number(process.env.CERTIFICATES_EXPORT_MAX_ROWS ?? '100000') /
      EXPORT_CERTIFICATES_BATCH_SIZE,
  ),
);
