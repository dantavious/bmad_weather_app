import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NotificationService } from '../../../../core/services/notification.service';
import { PrecipitationAlertService } from '../../../../core/services/precipitation-alert.service';
import { LocationService } from '../../../../core/services/location.service';

@Component({
  selector: 'app-precipitation-alert-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  template: `
    <mat-card class="alert-settings">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>notifications</mat-icon>
          Precipitation Alerts
        </mat-card-title>
      </mat-card-header>
      
      <mat-card-content>
        <!-- Main toggle -->
        <div class="settings-row">
          <div class="setting-label">
            <span>Enable Precipitation Alerts</span>
            <span class="setting-description">
              Get notified when rain or snow is starting within 15 minutes
            </span>
          </div>
          <mat-slide-toggle
            [checked]="notificationService.preferences().enabled"
            (change)="toggleNotifications($event.checked)"
            [disabled]="permissionDenied()"
          />
        </div>

        @if (permissionDenied()) {
          <div class="permission-warning">
            <mat-icon>warning</mat-icon>
            <span>Browser notifications are blocked. Please enable them in your browser settings.</span>
          </div>
        }

        @if (notificationService.preferences().enabled) {
          <mat-divider />

          <!-- Quiet hours -->
          <div class="settings-row">
            <div class="setting-label">
              <span>Quiet Hours</span>
              <span class="setting-description">
                Silence alerts during specified hours
              </span>
            </div>
            <mat-slide-toggle
              [checked]="notificationService.preferences().quietHoursEnabled"
              (change)="toggleQuietHours($event.checked)"
            />
          </div>

          @if (notificationService.preferences().quietHoursEnabled) {
            <div class="time-inputs">
              <mat-form-field appearance="outline">
                <mat-label>Start Time</mat-label>
                <input
                  matInput
                  type="time"
                  [value]="notificationService.preferences().quietHoursStart"
                  (change)="updateQuietHours($event, 'start')"
                />
              </mat-form-field>
              
              <mat-form-field appearance="outline">
                <mat-label>End Time</mat-label>
                <input
                  matInput
                  type="time"
                  [value]="notificationService.preferences().quietHoursEnd"
                  (change)="updateQuietHours($event, 'end')"
                />
              </mat-form-field>
            </div>
          }

          <mat-divider />

          <!-- Per-location settings -->
          <h3>Location Alerts</h3>
          @for (location of locationService.locations(); track location.id) {
            <div class="location-alert-row">
              <div class="location-info">
                <span class="location-name">{{ location.name }}</span>
                @if (alertService.hasActiveAlert(location.id)) {
                  <span class="active-alert">
                    <mat-icon>warning</mat-icon>
                    Alert Active
                  </span>
                }
              </div>
              <mat-slide-toggle
                [checked]="notificationService.isLocationAlertEnabled(location.id)"
                (change)="toggleLocationAlert(location.id, $event.checked)"
              />
            </div>
          } @empty {
            <p class="no-locations">No locations added yet</p>
          }

          <mat-divider />

          <!-- Test notification -->
          <div class="test-section">
            <button
              mat-raised-button
              color="primary"
              (click)="sendTestNotification()"
            >
              <mat-icon>notifications_active</mat-icon>
              Send Test Notification
            </button>
          </div>

          <!-- Monitoring status -->
          @if (alertService.isMonitoring()) {
            <div class="monitoring-status">
              <mat-icon class="status-icon">check_circle</mat-icon>
              <span>Monitoring active</span>
              @if (alertService.lastCheckTime()) {
                <span class="last-check">
                  Last checked: {{ formatLastCheck() }}
                </span>
              }
            </div>
          }
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .alert-settings {
      max-width: 600px;
      margin: 16px;
    }

    .settings-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 16px 0;
    }

    .setting-label {
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .setting-description {
      font-size: 12px;
      color: var(--mat-form-field-hint-text-color);
      margin-top: 4px;
    }

    .permission-warning {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: var(--mat-warn-container);
      color: var(--mat-warn-on-container);
      border-radius: 4px;
      margin: 16px 0;
    }

    .time-inputs {
      display: flex;
      gap: 16px;
      margin: 16px 0;
      padding-left: 24px;
    }

    .time-inputs mat-form-field {
      flex: 1;
    }

    h3 {
      margin: 16px 0 8px;
      font-size: 16px;
      font-weight: 500;
    }

    .location-alert-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
    }

    .location-info {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
    }

    .location-name {
      font-weight: 500;
    }

    .active-alert {
      display: flex;
      align-items: center;
      gap: 4px;
      color: var(--mat-warn-text);
      font-size: 12px;
    }

    .active-alert mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .no-locations {
      color: var(--mat-form-field-hint-text-color);
      text-align: center;
      padding: 24px;
    }

    .test-section {
      display: flex;
      justify-content: center;
      margin: 24px 0 16px;
    }

    .monitoring-status {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: var(--mat-success-container);
      color: var(--mat-success-on-container);
      border-radius: 4px;
      margin-top: 16px;
    }

    .status-icon {
      color: var(--mat-success-text);
    }

    .last-check {
      margin-left: auto;
      font-size: 12px;
      opacity: 0.8;
    }

    mat-divider {
      margin: 16px 0;
    }
  `],
})
export class PrecipitationAlertSettingsComponent {
  notificationService = inject(NotificationService);
  alertService = inject(PrecipitationAlertService);
  locationService = inject(LocationService);
  private snackBar = inject(MatSnackBar);

  permissionDenied = signal(false);

  constructor() {
    this.checkPermission();
  }

  private checkPermission(): void {
    if ('Notification' in window) {
      this.permissionDenied.set(Notification.permission === 'denied');
    }
  }

  async toggleNotifications(enabled: boolean): Promise<void> {
    if (enabled) {
      const success = await this.notificationService.enableNotifications();
      if (!success) {
        this.permissionDenied.set(true);
        this.snackBar.open(
          'Could not enable notifications. Please check browser permissions.',
          'OK',
          { duration: 5000 },
        );
      } else {
        this.snackBar.open('Precipitation alerts enabled', 'OK', {
          duration: 3000,
        });
        this.alertService.startMonitoring();
      }
    } else {
      await this.notificationService.disableNotifications();
      this.alertService.stopMonitoring();
      this.snackBar.open('Precipitation alerts disabled', 'OK', {
        duration: 3000,
      });
    }
  }

  async toggleQuietHours(enabled: boolean): Promise<void> {
    await this.notificationService.setQuietHours(enabled);
  }

  async updateQuietHours(event: Event, type: 'start' | 'end'): Promise<void> {
    const input = event.target as HTMLInputElement;
    const prefs = this.notificationService.preferences();
    
    if (type === 'start') {
      await this.notificationService.setQuietHours(
        prefs.quietHoursEnabled,
        input.value,
        prefs.quietHoursEnd,
      );
    } else {
      await this.notificationService.setQuietHours(
        prefs.quietHoursEnabled,
        prefs.quietHoursStart,
        input.value,
      );
    }
  }

  async toggleLocationAlert(locationId: string, enabled: boolean): Promise<void> {
    await this.notificationService.setLocationAlertEnabled(locationId, enabled);
  }

  async sendTestNotification(): Promise<void> {
    await this.notificationService.testNotification();
    this.snackBar.open('Test notification sent', 'OK', {
      duration: 3000,
    });
  }

  formatLastCheck(): string {
    const lastCheck = this.alertService.lastCheckTime();
    if (!lastCheck) return '';
    
    const now = new Date();
    const diff = now.getTime() - lastCheck.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'just now';
    if (minutes === 1) return '1 minute ago';
    return `${minutes} minutes ago`;
  }
}