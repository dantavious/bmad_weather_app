import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

export interface ErrorEvent {
  message: string;
  level: 'error' | 'warning' | 'info';
  category: 'http' | 'runtime' | 'validation' | 'permission';
  timestamp: Date;
  context?: Record<string, any>;
  stack?: string;
  user?: string;
  requestId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorTrackingService {
  private errorQueue: ErrorEvent[] = [];
  private maxQueueSize = 100;
  
  logError(error: Error | HttpErrorResponse, context?: Record<string, any>): void {
    const errorEvent = this.createErrorEvent(error, 'error', context);
    this.trackEvent(errorEvent);
  }
  
  logWarning(message: string, context?: Record<string, any>): void {
    const errorEvent: ErrorEvent = {
      message,
      level: 'warning',
      category: 'runtime',
      timestamp: new Date(),
      context
    };
    this.trackEvent(errorEvent);
  }
  
  logInfo(message: string, context?: Record<string, any>): void {
    const errorEvent: ErrorEvent = {
      message,
      level: 'info',
      category: 'runtime',
      timestamp: new Date(),
      context
    };
    this.trackEvent(errorEvent);
  }
  
  private createErrorEvent(
    error: Error | HttpErrorResponse, 
    level: 'error' | 'warning' = 'error',
    context?: Record<string, any>
  ): ErrorEvent {
    const isHttpError = error instanceof HttpErrorResponse;
    
    return {
      message: this.extractErrorMessage(error),
      level,
      category: isHttpError ? 'http' : 'runtime',
      timestamp: new Date(),
      context: {
        ...context,
        ...(isHttpError && {
          url: error.url,
          status: error.status,
          statusText: error.statusText
        })
      },
      stack: error instanceof Error ? error.stack : undefined,
      requestId: isHttpError ? error.headers?.get('x-request-id') || undefined : undefined
    };
  }
  
  private extractErrorMessage(error: Error | HttpErrorResponse): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message || error.message || `HTTP ${error.status} Error`;
    }
    return error.message || 'Unknown error occurred';
  }
  
  private trackEvent(event: ErrorEvent): void {
    // Console logging for MVP
    this.logToConsole(event);
    
    // Store in queue for future batch sending
    this.queueEvent(event);
    
    // Prepared for future Sentry integration
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   this.sendToSentry(event);
    // }
  }
  
  private logToConsole(event: ErrorEvent): void {
    const consoleMethod = event.level === 'error' ? console.error : 
                          event.level === 'warning' ? console.warn : 
                          console.info;
    
    const logData = {
      timestamp: event.timestamp.toISOString(),
      level: event.level,
      category: event.category,
      message: event.message,
      ...(event.context && { context: event.context }),
      ...(event.requestId && { requestId: event.requestId })
    };
    
    consoleMethod('[ErrorTracking]', logData);
    
    if (event.stack && event.level === 'error') {
      console.debug('Stack trace:', event.stack);
    }
  }
  
  private queueEvent(event: ErrorEvent): void {
    this.errorQueue.push(event);
    
    // Keep queue size manageable
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }
  }
  
  // Future method for Sentry integration
  private sendToSentry(event: ErrorEvent): void {
    // Will be implemented when Sentry is added
    // window.Sentry.captureException(event);
  }
  
  // Get error statistics for monitoring
  getErrorStats(): { total: number; byCategory: Record<string, number>; byLevel: Record<string, number> } {
    const stats = {
      total: this.errorQueue.length,
      byCategory: {} as Record<string, number>,
      byLevel: {} as Record<string, number>
    };
    
    this.errorQueue.forEach(event => {
      stats.byCategory[event.category] = (stats.byCategory[event.category] || 0) + 1;
      stats.byLevel[event.level] = (stats.byLevel[event.level] || 0) + 1;
    });
    
    return stats;
  }
  
  // Clear error queue (useful for testing)
  clearQueue(): void {
    this.errorQueue = [];
  }
}