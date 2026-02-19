import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import {
  isTransientDbError,
  DB_RETRY_MAX_ATTEMPTS,
  getDbRetryDelayMs,
} from '../utils/db-retry.util';

/**
 * Interceptor que reintenta automáticamente la petición cuando falla por
 * errores transitorios de conexión a la BD (ECONNRESET, ETIMEDOUT, etc.).
 * Evita notificar al usuario; solo se devuelve error tras agotar los reintentos.
 */
@Injectable()
export class DbRetryInterceptor implements NestInterceptor {
  private readonly logger = new Logger(DbRetryInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const tryNext = (attempt: number): Observable<unknown> =>
      next.handle().pipe(
        catchError((err: unknown) => {
          const mayRetry =
            isTransientDbError(err) && attempt < DB_RETRY_MAX_ATTEMPTS - 1;

          if (mayRetry) {
            const delayMs = getDbRetryDelayMs(attempt);
            const msg =
              err && typeof err === 'object' && 'message' in err
                ? String((err as { message?: unknown }).message)
                : String(err);
            this.logger.warn(
              `Reintentando por error transitorio de BD (intento ${attempt + 1}/${DB_RETRY_MAX_ATTEMPTS}, espera ${delayMs}ms): ${msg}`,
            );
            return timer(delayMs).pipe(switchMap(() => tryNext(attempt + 1)));
          }

          return throwError(() => err);
        }),
      );

    return tryNext(0);
  }
}
