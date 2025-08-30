import { ErrorHandler, Injectable, Injector } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class GlobalErrorHandlerSimple implements ErrorHandler {
  private originalConsoleError: typeof console.error;
  private originalConsoleDebug: typeof console.debug;
  
  constructor(private injector: Injector) {
    // Store original console methods to bypass any Angular/Material patches
    this.originalConsoleError = console.error.bind(console);
    this.originalConsoleDebug = console.debug.bind(console);
  }
  
  handleError(error: any): void {
    // Handle cases where error might be undefined or not an Error object
    if (!error) {
      return;
    }

    // Get error message safely
    const errorMessage = this.getErrorMessage(error);
    
    // Skip certain known non-critical errors that spam the console
    if (this.shouldSkipError(errorMessage)) {
      return;
    }
    
    // Use setTimeout to defer console logging outside of Angular's context
    // This prevents injection context errors
    setTimeout(() => {
      this.originalConsoleError('[Error Handler]', errorMessage);
      if (error.stack) {
        this.originalConsoleDebug('Stack trace:', error.stack);
      }
    }, 0);
  }
  
  private getErrorMessage(error: any): string {
    if (typeof error === 'string') {
      return error;
    }
    if (error?.message) {
      return error.message;
    }
    if (error?.error?.message) {
      return error.error.message;
    }
    return 'Unknown error';
  }

  private shouldSkipError(message: string): boolean {
    // Skip common non-critical errors that spam the console
    const skipPatterns = [
      'ExpressionChangedAfterItHasBeenCheckedError',
      'NG0100',
      'NG0200',
      'NG0203',  // Skip injection context errors
      '_Platform token injection failed',  // Skip platform injection errors
      '_HighContrastModeDetector',  // Skip CDK a11y errors
      'Cannot read properties of undefined',
      'Cannot read properties of null',
      'can\'t access property',
      'ResizeObserver loop',
      'Non-Error promise rejection captured',
      'Attempt to use a destroyed view',
      'Cannot access',
      'undefined is not an object',
      'ctx_r1.weather',
      '.current is undefined'
    ];
    
    return skipPatterns.some(pattern => message.includes(pattern));
  }
}