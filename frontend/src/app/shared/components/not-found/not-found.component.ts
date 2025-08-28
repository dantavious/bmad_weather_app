import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    RouterLink
  ],
  template: `
    <div class="not-found-container">
      <mat-card class="error-card">
        <mat-card-content>
          <mat-icon class="large-icon">error_outline</mat-icon>
          <h1>404 - Page Not Found</h1>
          <p>The page you are looking for doesn't exist.</p>
        </mat-card-content>
        <mat-card-actions>
          <a mat-raised-button color="primary" routerLink="/">
            GO TO HOME
          </a>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .not-found-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 60vh;
      padding: 20px;
    }
    
    .error-card {
      max-width: 400px;
      text-align: center;
      background-color: var(--mat-app-surface-container);
    }
    
    .large-icon {
      font-size: 72px;
      width: 72px;
      height: 72px;
      color: var(--mat-app-tertiary);
      margin: 20px auto;
    }
    
    h1 {
      margin: 16px 0;
      color: var(--mat-sys-on-surface);
    }
    
    p {
      color: var(--mat-sys-on-surface-variant);
      margin-bottom: 24px;
    }
  `]
})
export class NotFoundComponent {}