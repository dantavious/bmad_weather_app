import { Component, Input, Output, EventEmitter, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { 
  ActivityRecommendation, 
  ActivityType, 
  Rating,
  ActivitySettings 
} from '../../../../../../../shared/models/activity.model';

@Component({
  selector: 'app-activity-chips',
  standalone: true,
  imports: [CommonModule, MatChipsModule, MatIconModule],
  template: `
    @if (filteredRecommendations().length > 0) {
      <mat-chip-set class="activity-chips" aria-label="Activity recommendations">
        @for (activity of filteredRecommendations(); track activity.activityType) {
          <mat-chip 
            [class.good-rating]="activity.rating === 'good'"
            [class.fair-rating]="activity.rating === 'fair'"
            [class.poor-rating]="activity.rating === 'poor'"
            (click)="onActivityClick(activity)"
            [attr.aria-label]="getActivityLabel(activity)">
            <mat-icon class="chip-icon">{{ getActivityIcon(activity.activityType) }}</mat-icon>
            <span class="activity-name">{{ formatActivityName(activity.activityType) }}</span>
            <span class="activity-rating">{{ formatRating(activity.rating) }}</span>
            @if (showBestHours() && activity.bestHours && activity.bestHours.length > 0) {
              <span class="best-hours" [attr.title]="'Best times: ' + activity.bestHours.join(', ')">
                {{ activity.bestHours[0] }}
              </span>
            }
          </mat-chip>
        }
      </mat-chip-set>
    }
  `,
  styles: [`
    .activity-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }

    mat-chip {
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 12px;
      height: 28px;
      padding: 0 12px;
    }

    mat-chip:hover {
      transform: translateY(-2px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    .chip-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-right: 4px;
    }

    .activity-name {
      margin-right: 4px;
      font-weight: 500;
    }

    .activity-rating {
      font-size: 11px;
      opacity: 0.9;
    }

    .best-hours {
      margin-left: 8px;
      padding: 2px 6px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 10px;
      font-size: 10px;
      font-weight: 600;
    }

    .good-rating {
      background-color: #4caf50 !important;
      color: white !important;
    }

    .fair-rating {
      background-color: #ff9800 !important;
      color: white !important;
    }

    .poor-rating {
      background-color: #f44336 !important;
      color: white !important;
    }

    @media (max-width: 600px) {
      .activity-chips {
        gap: 4px;
      }

      mat-chip {
        font-size: 11px;
        height: 24px;
        padding: 0 8px;
      }

      .chip-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }
    }
  `]
})
export class ActivityChipsComponent {
  @Input() set recommendations(value: ActivityRecommendation[]) {
    this._recommendations.set(value);
  }
  @Input() set settings(value: ActivitySettings | undefined) {
    this._settings.set(value);
  }
  @Output() activitySelected = new EventEmitter<ActivityRecommendation>();

  _recommendations = signal<ActivityRecommendation[]>([]);
  _settings = signal<ActivitySettings | undefined>(undefined);

  showBestHours = computed(() => {
    return this._settings()?.showBestHours ?? true;
  });

  filteredRecommendations = computed(() => {
    const recs = this._recommendations();
    const activitySettings = this._settings();
    
    if (!activitySettings?.enabledActivities || activitySettings.enabledActivities.length === 0) {
      return recs;
    }
    
    return recs.filter(r => 
      activitySettings.enabledActivities.includes(r.activityType)
    );
  });

  onActivityClick(activity: ActivityRecommendation): void {
    this.activitySelected.emit(activity);
  }

  getActivityIcon(type: ActivityType): string {
    const icons: Record<ActivityType, string> = {
      [ActivityType.RUNNING]: 'directions_run',
      [ActivityType.CYCLING]: 'directions_bike',
      [ActivityType.GARDENING]: 'local_florist',
      [ActivityType.OUTDOOR_WORK]: 'construction',
      [ActivityType.STARGAZING]: 'nights_stay'
    };
    return icons[type] || 'help_outline';
  }

  formatActivityName(type: ActivityType): string {
    const names: Record<ActivityType, string> = {
      [ActivityType.RUNNING]: 'Running',
      [ActivityType.CYCLING]: 'Cycling',
      [ActivityType.GARDENING]: 'Gardening',
      [ActivityType.OUTDOOR_WORK]: 'Outdoor Work',
      [ActivityType.STARGAZING]: 'Stargazing'
    };
    return names[type] || type;
  }

  formatRating(rating: Rating): string {
    const labels: Record<Rating, string> = {
      [Rating.GOOD]: '✓ Good',
      [Rating.FAIR]: '~ Fair',
      [Rating.POOR]: '✗ Poor'
    };
    return labels[rating] || rating;
  }

  getActivityLabel(activity: ActivityRecommendation): string {
    return `${this.formatActivityName(activity.activityType)} - ${this.formatRating(activity.rating)} conditions`;
  }
}