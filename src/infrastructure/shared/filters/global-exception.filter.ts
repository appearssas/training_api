import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { isTransientDbError } from '../utils/db-retry.util';

const RETRY_MESSAGE =
  'Conexión con la base de datos interrumpida. Por favor, intente de nuevo en unos segundos.';

interface ExceptionWithMessage {
  message?: string;
  name?: string;
  status?: number;
  error?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Ignorar silenciosamente peticiones de Chrome DevTools y otros servicios automáticos
    const ignoredPaths = [
      '/.well-known/appspecific/com.chrome.devtools.json',
      '/.well-known/',
      '/favicon.ico',
    ];

    const shouldIgnore = ignoredPaths.some(path =>
      request.url.startsWith(path),
    );

    if (shouldIgnore) {
      // Responder 404 sin loguear el error
      return response.status(HttpStatus.NOT_FOUND).json({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Not Found',
      });
    }

    this.logger.error('Global exception caught:', exception);

    // Capturar errores de validación de class-validator
    if (exception instanceof BadRequestException) {
      const errorResponse = exception.getResponse() as Record<string, any>;

      if (errorResponse.message && Array.isArray(errorResponse.message)) {
        this.logger.error('Validation error:', errorResponse.message);
        return response.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Validation failed',
          errors: errorResponse.message,
          error: 'Bad Request',
          timestamp: new Date().toISOString(),
          path: request.url,
        });
      }

      const message =
        typeof errorResponse.message === 'string'
          ? errorResponse.message
          : 'Bad Request';

      if (isTransientDbError({ message })) {
        this.logger.warn(
          'Transient DB error (e.g. ECONNRESET) rethrown as BadRequest:',
          message,
        );
        return response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          message: RETRY_MESSAGE,
          error: 'Service Unavailable',
          timestamp: new Date().toISOString(),
          path: request.url,
        });
      }

      this.logger.error('BadRequestException:', message);
      return response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message,
        error: 'Bad Request',
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }

    const exceptionWithMessage = exception as ExceptionWithMessage;

    // Capturar errores de metadatos de TypeORM
    if (exceptionWithMessage.message?.includes('EntityMetadataNotFoundError')) {
      this.logger.error('TypeORM metadata error:', exception);
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Entity configuration error',
        error: 'Internal Server Error',
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }

    // Capturar errores de inicialización
    if (exceptionWithMessage.message?.includes('initialization failed')) {
      this.logger.error('Initialization error:', exception);
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Service initialization error',
        error: 'Internal Server Error',
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }

    // Capturar errores de base de datos
    if (exceptionWithMessage.name === 'QueryFailedError') {
      this.logger.error('Database error:', exception);
      if (isTransientDbError(exception)) {
        return response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          message: RETRY_MESSAGE,
          error: 'Service Unavailable',
          timestamp: new Date().toISOString(),
          path: request.url,
        });
      }
      return response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Database operation failed',
        error: 'Bad Request',
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }

    // Error genérico
    const status =
      exceptionWithMessage.status || HttpStatus.INTERNAL_SERVER_ERROR;
    const message = exceptionWithMessage.message || 'Internal server error';

    return response.status(status).json({
      statusCode: status,
      message,
      error: exceptionWithMessage.error || 'Internal Server Error',
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
