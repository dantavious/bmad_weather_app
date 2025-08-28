import { ErrorHandler, Injectable } from '@angular/core';
import { ErrorService } from './error.service';

@Injectable()
export class GlobalErrorHandler extends ErrorHandler {
  constructor(private errorService: ErrorService) {
    super();
  }
  
  override handleError(error: Error): void {
    const message = this.getUserFriendlyMessage(error);
    this.errorService.showError(message);
    console.error('Global error:', error);
  }
  
  private getUserFriendlyMessage(error: Error): string {
    if (error.message.includes('Network')) {
      return 'Network error. Please check your connection.';
    }
    if (error.message.includes('500')) {
      return 'Server error. Please try again later.';
    }
    if (error.message.includes('404')) {
      return 'Resource not found.';
    }
    return 'An unexpected error occurred. Please try again.';
  }
}