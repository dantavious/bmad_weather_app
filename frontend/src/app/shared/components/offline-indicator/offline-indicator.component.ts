import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { OfflineService } from '../../../core/services/offline.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-offline-indicator',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    @if (offlineService.isOffline()) {
      <div class="offline-banner" @slideDown>
        <mat-icon class="offline-icon">cloud_off</mat-icon>
        <span class="offline-message">{{ offlineService.getOfflineMessage() }}</span>
        <span class="offline-info">Some features may be limited</span>
      </div>
    }
  `,
  styles: [`
    .offline-banner {
      position: sticky;
      top: 64px;
      z-index: 999;
      background-color: var(--mat-warn-container);
      color: var(--mat-warn-on-container);
      padding: 12px 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      font-size: 14px;
    }

    .offline-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .offline-message {
      font-weight: 500;
      flex: 1;
    }

    .offline-info {
      opacity: 0.8;
      font-size: 12px;
    }

    @media (max-width: 599px) {
      .offline-banner {
        top: 56px;
        padding: 8px 16px;
        font-size: 13px;
      }

      .offline-info {
        display: none;
      }
    }

    @media (max-width: 400px) {
      .offline-banner {
        gap: 8px;
      }

      .offline-message {
        font-size: 12px;
      }
    }
  `],
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ transform: 'translateY(-100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateY(-100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class OfflineIndicatorComponent {
  readonly offlineService = inject(OfflineService);
}