import { ErrorHandler, Injectable, inject } from '@angular/core';
import { ErrorService } from './error.service';

@Injectable()
export class GlobalErrorHandler extends ErrorHandler {
  private errorService = inject(ErrorService);
  
  constructor() {
    super();
  }
  
  override handleError(error: any): void {
    // Handle cases where error might be undefined or not an Error object
    if (!error) {
      console.warn('Empty error received in global error handler');
      return;
    }

    // Only show user-facing errors for actual errors, not lifecycle issues
    const errorMessage = this.getErrorMessage(error);
    
    // Skip certain known non-critical errors
    if (this.shouldSkipError(errorMessage)) {
      console.debug('Skipping non-critical error:', errorMessage);
      return;
    }

    const userMessage = this.getUserFriendlyMessage(errorMessage);
    
    // Only show snackbar for actual user-facing errors
    if (this.isUserFacingError(error)) {
      this.errorService.showError(userMessage);
    }
    
    // Log the full error for debugging
    console.error('Global error:', error);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
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
    // Skip common non-critical errors
    const skipPatterns = [
      'ExpressionChangedAfterItHasBeenCheckedError',
      'NG0100',
      'Cannot read properties of undefined',
      'ResizeObserver loop',
      'Non-Error promise rejection captured'
    ];
    
    return skipPatterns.some(pattern => message.includes(pattern));
  }

  private isUserFacingError(error: any): boolean {
    // Only show errors that are actual HTTP or network failures
    return error?.status >= 400 || 
           error?.message?.includes('Network') ||
           error?.message?.includes('Failed to fetch');
  }
  
  private getUserFriendlyMessage(errorMessage: string): string {
    if (errorMessage.includes('Network')) {
      return 'Network error. Please check your connection.';
    }
    if (errorMessage.includes('500')) {
      return 'Server error. Please try again later.';
    }
    if (errorMessage.includes('404')) {
      return 'Resource not found.';
    }
    if (errorMessage.includes('Failed to fetch')) {
      return 'Unable to connect to server. Please try again.';
    }
    return 'An unexpected error occurred. Please try again.';
  }
}