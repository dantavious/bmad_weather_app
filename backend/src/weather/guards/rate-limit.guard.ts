import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private requests = new Map<string, number[]>();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(private configService: ConfigService) {
    this.windowMs = this.configService.get<number>('rateLimit.windowMs', 60000);
    this.maxRequests = this.configService.get<number>('rateLimit.maxRequests', 60);
    
    this.startCleanupInterval();
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const ip = this.getClientIp(request);
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    const requestTimes = this.requests.get(ip) || [];
    
    const recentRequests = requestTimes.filter(time => time > windowStart);
    
    if (recentRequests.length >= this.maxRequests) {
      throw new HttpException(
        'Too many requests, please try again later',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    
    recentRequests.push(now);
    this.requests.set(ip, recentRequests);
    
    return true;
  }

  private getClientIp(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      return (forwarded as string).split(',')[0].trim();
    }
    
    return request.connection.remoteAddress || request.socket.remoteAddress || 'unknown';
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      const now = Date.now();
      const windowStart = now - this.windowMs;
      
      for (const [ip, times] of this.requests.entries()) {
        const recentRequests = times.filter(time => time > windowStart);
        
        if (recentRequests.length === 0) {
          this.requests.delete(ip);
        } else {
          this.requests.set(ip, recentRequests);
        }
      }
    }, 60000);
  }
}