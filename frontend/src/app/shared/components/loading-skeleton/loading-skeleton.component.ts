import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-loading-skeleton',
  standalone: true,
  imports: [CommonModule, MatProgressBarModule],
  template: `
    <div class="skeleton-container" [style.height]="height">
      <div class="skeleton-content">
        @for (line of lines; track $index) {
          <div 
            class="skeleton-line" 
            [style.width]="line.width"
            [style.height]="line.height"
            [class.skeleton-animate]="animate">
          </div>
        }
      </div>
      @if (showProgress) {
        <mat-progress-bar mode="indeterminate"></mat-progress-bar>
      }
    </div>
  `,
  styles: [`
    .skeleton-container {
      position: relative;
      padding: 16px;
      background: var(--mat-app-surface-container);
      border-radius: 8px;
      overflow: hidden;
    }
    
    .skeleton-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .skeleton-line {
      background: linear-gradient(
        90deg,
        var(--mat-sys-surface-variant) 0%,
        var(--mat-sys-surface-bright) 50%,
        var(--mat-sys-surface-variant) 100%
      );
      border-radius: 4px;
      background-size: 200% 100%;
    }
    
    .skeleton-animate {
      animation: shimmer 1.5s infinite;
    }
    
    @keyframes shimmer {
      0% {
        background-position: -200% 0;
      }
      100% {
        background-position: 200% 0;
      }
    }
    
    mat-progress-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
    }
  `]
})
export class LoadingSkeletonComponent {
  @Input() height = '200px';
  @Input() showProgress = false;
  @Input() animate = true;
  @Input() lines = [
    { width: '60%', height: '20px' },
    { width: '100%', height: '16px' },
    { width: '80%', height: '16px' },
    { width: '40%', height: '16px' }
  ];
}