import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url } = request;
    const userAgent = request.get('user-agent') || '';
    const ip = this.getClientIp(request);
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const elapsed = Date.now() - start;
          const { statusCode } = response;
          
          this.logger.log({
            message: 'HTTP Request',
            method,
            url,
            statusCode,
            elapsed: `${elapsed}ms`,
            userAgent,
            ip,
          });
        },
        error: (error) => {
          const elapsed = Date.now() - start;
          const statusCode = error?.status || 500;
          
          this.logger.error({
            message: 'HTTP Request Error',
            method,
            url,
            statusCode,
            elapsed: `${elapsed}ms`,
            userAgent,
            ip,
            error: error?.message || 'Internal Server Error',
            stack: error?.stack,
          });
        },
      }),
    );
  }

  private getClientIp(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      return (forwarded as string).split(',')[0].trim();
    }
    
    return request.connection.remoteAddress || request.socket.remoteAddress || 'unknown';
  }
}