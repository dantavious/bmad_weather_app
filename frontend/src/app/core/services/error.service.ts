import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class ErrorService {
  private snackBar = inject(MatSnackBar);
  
  showError(message: string) {
    this.snackBar.open(message, 'CLOSE', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: 'error-snackbar'
    });
  }
}