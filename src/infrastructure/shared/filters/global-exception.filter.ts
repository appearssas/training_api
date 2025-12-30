import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';

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

      // Si el mensaje es un string, devolverlo directamente
      const message = typeof errorResponse.message === 'string' 
        ? errorResponse.message 
        : 'Bad Request';
      
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
