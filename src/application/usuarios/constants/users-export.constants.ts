import { EXPORT_BATCH_SIZE } from '../dto/export-users.query.dto';

/** Máximo de lotes en export scope=all (batch size × esto = tope de filas aproximado). */
export const EXPORT_ALL_MAX_BATCH_ITERATIONS = Math.max(
  1,
  Math.ceil(
    Number(process.env.USERS_EXPORT_MAX_ROWS ?? '100000') / EXPORT_BATCH_SIZE,
  ),
);
