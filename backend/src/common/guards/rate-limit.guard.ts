import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private requests = new Map<string, { count: number; resetTime: number }>();
  private readonly RATE_LIMIT = 100; // requests per window
  private readonly WINDOW_MS = 60000; // 1 minute

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip || request.connection.remoteAddress || 'unknown';
    
    const now = Date.now();
    const userRequests = this.requests.get(ip);

    if (!userRequests || now > userRequests.resetTime) {
      this.requests.set(ip, {
        count: 1,
        resetTime: now + this.WINDOW_MS,
      });
      return true;
    }

    if (userRequests.count >= this.RATE_LIMIT) {
      throw new HttpException(
        'Too many requests, please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    userRequests.count++;
    return true;
  }
}