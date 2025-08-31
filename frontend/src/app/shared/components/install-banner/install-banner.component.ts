import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { InstallPromptService } from '../../../core/services/install-prompt.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-install-banner',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    @if (installPromptService.canInstall()) {
      <div class="install-banner" @slideIn>
        <mat-card class="install-card">
          <mat-card-content class="install-content">
            <mat-icon class="install-icon">install_mobile</mat-icon>
            <div class="install-text">
              <div class="install-title">Install BMad Weather</div>
              <div class="install-subtitle">Add to your home screen for quick access</div>
            </div>
            <div class="install-actions">
              <button mat-button (click)="onDismiss()">Not Now</button>
              <button mat-raised-button color="primary" (click)="onInstall()">Install</button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    }
  `,
  styles: [`
    .install-banner {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 1000;
      width: 90%;
      max-width: 500px;
    }

    .install-card {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .install-content {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px !important;
    }

    .install-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
      color: var(--mat-primary);
    }

    .install-text {
      flex: 1;
    }

    .install-title {
      font-weight: 500;
      font-size: 16px;
      margin-bottom: 4px;
    }

    .install-subtitle {
      font-size: 14px;
      opacity: 0.8;
    }

    .install-actions {
      display: flex;
      gap: 8px;
    }

    @media (max-width: 600px) {
      .install-banner {
        width: 95%;
        bottom: 10px;
      }

      .install-content {
        flex-direction: column;
        text-align: center;
      }

      .install-actions {
        width: 100%;
        justify-content: space-around;
      }
    }
  `],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(-50%) translateY(100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(-50%) translateY(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateX(-50%) translateY(100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class InstallBannerComponent {
  readonly installPromptService = inject(InstallPromptService);

  async onInstall(): Promise<void> {
    await this.installPromptService.showInstallPrompt();
  }

  onDismiss(): void {
    this.installPromptService.dismissInstallPrompt();
  }
}