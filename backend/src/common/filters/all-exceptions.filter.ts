import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  requestId: string;
  path?: string;
  method?: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = uuidv4();

    const status = this.getStatus(exception);
    const errorResponse = this.createErrorResponse(exception, request, requestId);

    // Log error with structured data
    this.logError(exception, request, requestId, status);

    // Set response headers
    response.setHeader('X-Request-Id', requestId);
    
    // Send error response
    response.status(status).json(errorResponse);
  }

  private getStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private createErrorResponse(
    exception: unknown,
    request: Request,
    requestId: string,
  ): ApiError {
    const timestamp = new Date().toISOString();
    const path = request.url;
    const method = request.method;

    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      const message = typeof response === 'string' 
        ? response 
        : (response as any).message || exception.message;
      
      return {
        code: this.getErrorCode(exception.getStatus()),
        message,
        details: typeof response === 'object' ? response : undefined,
        timestamp,
        requestId,
        path,
        method,
      };
    }

    // Handle non-HTTP exceptions
    const error = exception as Error;
    return {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? {
        error: error.message,
        stack: error.stack,
      } : undefined,
      timestamp,
      requestId,
      path,
      method,
    };
  }

  private getErrorCode(status: number): string {
    const errorCodes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
      504: 'GATEWAY_TIMEOUT',
    };
    return errorCodes[status] || 'UNKNOWN_ERROR';
  }

  private logError(
    exception: unknown,
    request: Request,
    requestId: string,
    status: number,
  ): void {
    const logData = {
      requestId,
      method: request.method,
      url: request.url,
      status,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
      timestamp: new Date().toISOString(),
    };

    if (status >= 500) {
      this.logger.error(
        `[${requestId}] Internal Server Error`,
        exception instanceof Error ? exception.stack : exception,
        logData,
      );
    } else if (status >= 400) {
      this.logger.warn(
        `[${requestId}] Client Error: ${(exception as any).message || 'Unknown'}`,
        logData,
      );
    } else {
      this.logger.log(
        `[${requestId}] Request processed with status ${status}`,
        logData,
      );
    }
  }
}