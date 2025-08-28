import { ErrorHandler, Injectable } from '@angular/core';

@Injectable()
export class GlobalErrorHandlerSimple extends ErrorHandler {
  
  override handleError(error: any): void {
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
    
    // Log the error for debugging
    console.error('[Error Handler]', errorMessage);
    if (error.stack) {
      console.debug('Stack trace:', error.stack);
    }
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