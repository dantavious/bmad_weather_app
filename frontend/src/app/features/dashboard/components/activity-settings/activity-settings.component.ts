import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SettingsService } from '../../../../core/services/settings.service';
import { ActivityType } from '../../../../../../../shared/models/activity.model';

interface ActivityOption {
  type: ActivityType;
  label: string;
  icon: string;
  description: string;
  enabled: boolean;
}

@Component({
  selector: 'app-activity-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  template: `
    <mat-card class="activity-settings">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>directions_run</mat-icon>
          Activity Recommendations
        </mat-card-title>
      </mat-card-header>
      
      <mat-card-content>
        <!-- Main toggle -->
        <div class="settings-row">
          <div class="setting-label">
            <span>Show Activity Recommendations</span>
            <span class="setting-description">
              Display weather-based activity ratings on location cards
            </span>
          </div>
          <mat-slide-toggle
            [checked]="showActivities()"
            (change)="toggleShowActivities($event.checked)">
          </mat-slide-toggle>
        </div>

        @if (showActivities()) {
          <mat-divider />

          <!-- Best hours toggle -->
          <div class="settings-row">
            <div class="setting-label">
              <span>Show Best Hours</span>
              <span class="setting-description">
                Display optimal times for each activity
              </span>
            </div>
            <mat-slide-toggle
              [checked]="showBestHours()"
              (change)="toggleShowBestHours($event.checked)">
            </mat-slide-toggle>
          </div>

          <mat-divider />

          <!-- Activity selection -->
          <div class="activity-selection">
            <h3>Select Activities to Track</h3>
            <div class="activities-grid">
              @for (activity of activities(); track activity.type) {
                <div class="activity-item">
                  <mat-checkbox
                    [checked]="activity.enabled"
                    (change)="toggleActivity(activity.type, $event.checked)"
                    [disabled]="!hasMinimumActivities() && activity.enabled">
                    <div class="activity-content">
                      <div class="activity-header">
                        <mat-icon>{{ activity.icon }}</mat-icon>
                        <span class="activity-label">{{ activity.label }}</span>
                      </div>
                      <span class="activity-description">{{ activity.description }}</span>
                    </div>
                  </mat-checkbox>
                </div>
              }
            </div>
            @if (!hasMinimumActivities()) {
              <div class="warning-message">
                <mat-icon>info</mat-icon>
                <span>At least one activity must be selected</span>
              </div>
            }
          </div>
        }

        <!-- Save button -->
        <div class="action-buttons">
          <button 
            mat-raised-button 
            color="primary"
            (click)="saveSettings()">
            <mat-icon>save</mat-icon>
            Save Settings
          </button>
          <button 
            mat-button
            (click)="resetToDefaults()">
            <mat-icon>restore</mat-icon>
            Reset to Defaults
          </button>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .activity-settings {
      margin: 16px 0;
    }

    mat-card-header {
      margin-bottom: 16px;
    }

    mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 20px;
    }

    .settings-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 0;
    }

    .setting-label {
      display: flex;
      flex-direction: column;
      flex: 1;
      margin-right: 16px;
    }

    .setting-label span:first-child {
      font-weight: 500;
      margin-bottom: 4px;
    }

    .setting-description {
      font-size: 13px;
      color: var(--mat-sys-on-surface-variant);
      line-height: 1.4;
    }

    mat-divider {
      margin: 8px 0;
    }

    .activity-selection {
      padding: 16px 0;
    }

    .activity-selection h3 {
      font-size: 16px;
      font-weight: 500;
      margin: 0 0 16px 0;
      color: var(--mat-sys-on-surface);
    }

    .activities-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 12px;
      margin-bottom: 16px;
    }

    .activity-item {
      padding: 12px;
      border-radius: 8px;
      background-color: var(--mat-sys-surface-container);
      transition: background-color 0.2s;
    }

    .activity-item:hover {
      background-color: var(--mat-sys-surface-container-high);
    }

    .activity-content {
      display: flex;
      flex-direction: column;
      margin-left: 8px;
    }

    .activity-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .activity-header mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: var(--mat-sys-primary);
    }

    .activity-label {
      font-weight: 500;
      color: var(--mat-sys-on-surface);
    }

    .activity-description {
      font-size: 12px;
      color: var(--mat-sys-on-surface-variant);
      line-height: 1.3;
    }

    .warning-message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background-color: var(--mat-sys-error-container);
      color: var(--mat-sys-on-error-container);
      border-radius: 8px;
      font-size: 14px;
    }

    .warning-message mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .action-buttons {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      padding-top: 24px;
      border-top: 1px solid var(--mat-sys-outline-variant);
      margin-top: 24px;
    }

    button mat-icon {
      margin-right: 4px;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    @media (max-width: 600px) {
      .activities-grid {
        grid-template-columns: 1fr;
      }

      .action-buttons {
        flex-direction: column;
      }

      .action-buttons button {
        width: 100%;
      }
    }
  `]
})
export class ActivitySettingsComponent {
  private settingsService = inject(SettingsService);
  private snackBar = inject(MatSnackBar);

  // Load current settings
  private currentSettings = this.settingsService.getActivitySettings();
  
  showActivities = signal(this.currentSettings?.showActivities ?? true);
  showBestHours = signal(this.currentSettings?.showBestHours ?? true);
  
  activities = signal<ActivityOption[]>([
    {
      type: ActivityType.RUNNING,
      label: 'Running',
      icon: 'directions_run',
      description: 'Track conditions for outdoor running',
      enabled: this.isActivityEnabled(ActivityType.RUNNING)
    },
    {
      type: ActivityType.CYCLING,
      label: 'Cycling',
      icon: 'directions_bike',
      description: 'Monitor weather for bike rides',
      enabled: this.isActivityEnabled(ActivityType.CYCLING)
    },
    {
      type: ActivityType.GARDENING,
      label: 'Gardening',
      icon: 'local_florist',
      description: 'Check conditions for garden work',
      enabled: this.isActivityEnabled(ActivityType.GARDENING)
    },
    {
      type: ActivityType.OUTDOOR_WORK,
      label: 'Outdoor Work',
      icon: 'construction',
      description: 'Assess weather for outdoor projects',
      enabled: this.isActivityEnabled(ActivityType.OUTDOOR_WORK)
    },
    {
      type: ActivityType.STARGAZING,
      label: 'Stargazing',
      icon: 'nights_stay',
      description: 'Find clear nights for astronomy',
      enabled: this.isActivityEnabled(ActivityType.STARGAZING)
    }
  ]);

  enabledActivities = computed(() => 
    this.activities().filter(a => a.enabled).map(a => a.type)
  );

  hasMinimumActivities = computed(() => 
    this.enabledActivities().length > 1
  );

  private isActivityEnabled(type: ActivityType): boolean {
    const enabledList = this.currentSettings?.enabledActivities || [
      ActivityType.RUNNING,
      ActivityType.CYCLING,
      ActivityType.GARDENING
    ];
    return enabledList.includes(type);
  }

  toggleShowActivities(checked: boolean): void {
    this.showActivities.set(checked);
  }

  toggleShowBestHours(checked: boolean): void {
    this.showBestHours.set(checked);
  }

  toggleActivity(type: ActivityType, checked: boolean): void {
    this.activities.update(activities => 
      activities.map(a => 
        a.type === type ? { ...a, enabled: checked } : a
      )
    );
  }

  saveSettings(): void {
    const settings = {
      showActivities: this.showActivities(),
      showBestHours: this.showBestHours(),
      enabledActivities: this.enabledActivities(),
      customThresholds: undefined // Future feature
    };

    this.settingsService.updateActivitySettings(settings);
    
    this.snackBar.open('Activity settings saved', 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  resetToDefaults(): void {
    // Reset to default settings
    this.showActivities.set(true);
    this.showBestHours.set(true);
    
    const defaultActivities = [
      ActivityType.RUNNING,
      ActivityType.CYCLING,
      ActivityType.GARDENING
    ];
    
    this.activities.update(activities =>
      activities.map(a => ({
        ...a,
        enabled: defaultActivities.includes(a.type)
      }))
    );

    this.snackBar.open('Settings reset to defaults', 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }
}