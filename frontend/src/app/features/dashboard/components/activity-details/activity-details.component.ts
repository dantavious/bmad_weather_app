import { Component, Input, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivityRecommendation, ActivityType, Rating } from '../../../../../../../shared/models/activity.model';
import { animate, state, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-activity-details',
  standalone: true,
  imports: [
    CommonModule,
    MatExpansionModule,
    MatChipsModule,
    MatIconModule,
    MatTooltipModule
  ],
  animations: [
    trigger('expandCollapse', [
      state('collapsed', style({ height: '0px', opacity: 0 })),
      state('expanded', style({ height: '*', opacity: 1 })),
      transition('collapsed <=> expanded', animate('300ms ease-in-out'))
    ])
  ],
  template: `
    <mat-expansion-panel 
      [expanded]="expanded()"
      (expandedChange)="onExpandedChange($event)"
      class="activity-details-panel">
      
      <mat-expansion-panel-header>
        <mat-panel-title class="activity-title">
          <mat-icon [class]="'activity-icon ' + getRatingClass(recommendation().rating)">
            {{ getActivityIcon(recommendation().activityType) }}
          </mat-icon>
          <span>{{ getActivityLabel(recommendation().activityType) }}</span>
          <mat-chip 
            [class]="getRatingClass(recommendation().rating)"
            class="rating-chip">
            {{ recommendation().rating }}
          </mat-chip>
        </mat-panel-title>
      </mat-expansion-panel-header>

      <div class="details-content">
        @if (recommendation().bestHours && recommendation().bestHours.length > 0) {
          <div class="best-hours-section">
            <h4>Best Hours Today</h4>
            <mat-chip-set class="best-hours-chips">
              @for (hour of recommendation().bestHours; track hour) {
                <mat-chip class="best-hour-chip" highlighted>
                  <mat-icon>schedule</mat-icon>
                  {{ hour }}
                </mat-chip>
              }
            </mat-chip-set>
          </div>
        }

        <div class="factors-section">
          <h4>Weather Factors</h4>
          <div class="factors-grid">
            @for (factor of getFactors(); track factor.name) {
              <div class="factor-item">
                <div class="factor-header">
                  <mat-icon [matTooltip]="getFactorTooltip(factor.name)">
                    {{ getFactorIcon(factor.name) }}
                  </mat-icon>
                  <span class="factor-name">{{ factor.label }}</span>
                </div>
                <mat-chip [class]="getRatingClass(factor.rating)" class="factor-rating">
                  {{ factor.rating }}
                </mat-chip>
                <div class="factor-explanation">
                  {{ getFactorExplanation(recommendation().activityType, factor.name, factor.rating) }}
                </div>
              </div>
            }
          </div>
        </div>

        <div class="overall-score">
          <h4>Overall Score</h4>
          <div class="score-display">
            <span class="score-value">{{ recommendation().score }}/100</span>
            <span class="score-description">{{ getScoreDescription(recommendation().score) }}</span>
          </div>
        </div>
      </div>
    </mat-expansion-panel>
  `,
  styles: [`
    .activity-details-panel {
      margin: 8px 0;
      border-radius: 8px;
    }

    .activity-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .activity-icon {
      font-size: 24px;
    }

    .rating-chip {
      margin-left: auto;
      font-weight: 600;
    }

    .details-content {
      padding: 16px;
    }

    .best-hours-section {
      margin-bottom: 24px;
    }

    .best-hours-section h4 {
      margin: 0 0 12px 0;
      color: var(--mat-sys-on-surface-variant);
      font-size: 14px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .best-hours-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .best-hour-chip {
      background-color: var(--mat-sys-primary-container) !important;
      color: var(--mat-sys-on-primary-container) !important;
    }

    .best-hour-chip mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-right: 4px;
    }

    .factors-section h4 {
      margin: 0 0 16px 0;
      color: var(--mat-sys-on-surface-variant);
      font-size: 14px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .factors-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .factor-item {
      padding: 12px;
      border-radius: 8px;
      background-color: var(--mat-sys-surface-container);
    }

    .factor-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .factor-header mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: var(--mat-sys-on-surface-variant);
    }

    .factor-name {
      font-weight: 500;
      color: var(--mat-sys-on-surface);
    }

    .factor-rating {
      margin-bottom: 8px;
      font-size: 12px;
    }

    .factor-explanation {
      font-size: 13px;
      color: var(--mat-sys-on-surface-variant);
      line-height: 1.4;
    }

    .overall-score {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid var(--mat-sys-outline-variant);
    }

    .overall-score h4 {
      margin: 0 0 12px 0;
      color: var(--mat-sys-on-surface-variant);
      font-size: 14px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .score-display {
      display: flex;
      align-items: baseline;
      gap: 12px;
    }

    .score-value {
      font-size: 24px;
      font-weight: 600;
      color: var(--mat-sys-primary);
    }

    .score-description {
      font-size: 14px;
      color: var(--mat-sys-on-surface-variant);
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
      .factors-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ActivityDetailsComponent {
  private _recommendation = signal<ActivityRecommendation>({
    activityType: ActivityType.RUNNING,
    rating: Rating.GOOD,
    score: 0,
    bestHours: [],
    factors: {
      temperature: Rating.GOOD,
      wind: Rating.GOOD,
      precipitation: Rating.GOOD,
      humidity: Rating.GOOD
    }
  });
  
  recommendation = this._recommendation.asReadonly();
  
  @Input({ required: true }) set inputRecommendation(value: ActivityRecommendation) {
    this._recommendation.set(value);
  }

  expanded = signal(false);

  onExpandedChange(expanded: boolean): void {
    this.expanded.set(expanded);
  }

  getActivityIcon(type: ActivityType): string {
    const icons: Record<ActivityType, string> = {
      [ActivityType.RUNNING]: 'directions_run',
      [ActivityType.CYCLING]: 'directions_bike',
      [ActivityType.GARDENING]: 'local_florist',
      [ActivityType.OUTDOOR_WORK]: 'construction',
      [ActivityType.STARGAZING]: 'nights_stay'
    };
    return icons[type] || 'sports';
  }

  getActivityLabel(type: ActivityType): string {
    const labels: Record<ActivityType, string> = {
      [ActivityType.RUNNING]: 'Running',
      [ActivityType.CYCLING]: 'Cycling',
      [ActivityType.GARDENING]: 'Gardening',
      [ActivityType.OUTDOOR_WORK]: 'Outdoor Work',
      [ActivityType.STARGAZING]: 'Stargazing'
    };
    return labels[type] || type;
  }

  getRatingClass(rating: Rating): string {
    return `${rating}-rating`;
  }

  getFactors(): Array<{ name: string; label: string; rating: Rating }> {
    const factors = this.recommendation().factors;
    const result = [];
    
    if (factors.temperature !== undefined) {
      result.push({ name: 'temperature', label: 'Temperature', rating: factors.temperature });
    }
    if (factors.wind !== undefined) {
      result.push({ name: 'wind', label: 'Wind', rating: factors.wind });
    }
    if (factors.precipitation !== undefined) {
      result.push({ name: 'precipitation', label: 'Precipitation', rating: factors.precipitation });
    }
    if (factors.humidity !== undefined) {
      result.push({ name: 'humidity', label: 'Humidity', rating: factors.humidity });
    }
    if (factors.aqi !== undefined) {
      result.push({ name: 'aqi', label: 'Air Quality', rating: factors.aqi });
    }
    
    return result;
  }

  getFactorIcon(factor: string): string {
    const icons: Record<string, string> = {
      temperature: 'thermostat',
      wind: 'air',
      precipitation: 'water_drop',
      humidity: 'water',
      aqi: 'eco'
    };
    return icons[factor] || 'info';
  }

  getFactorTooltip(factor: string): string {
    const tooltips: Record<string, string> = {
      temperature: 'How temperature affects this activity',
      wind: 'Wind speed impact on activity comfort',
      precipitation: 'Rain/snow conditions for activity',
      humidity: 'Humidity comfort level',
      aqi: 'Air quality index for outdoor activities'
    };
    return tooltips[factor] || '';
  }

  getFactorExplanation(activity: ActivityType, factor: string, rating: Rating): string {
    const explanations: Record<string, Record<Rating, string>> = {
      temperature: {
        [Rating.GOOD]: 'Temperature is ideal for this activity',
        [Rating.FAIR]: 'Temperature is acceptable but not optimal',
        [Rating.POOR]: 'Temperature makes this activity uncomfortable or unsafe'
      },
      wind: {
        [Rating.GOOD]: 'Wind conditions are perfect',
        [Rating.FAIR]: 'Moderate wind may affect comfort',
        [Rating.POOR]: 'High winds make activity difficult'
      },
      precipitation: {
        [Rating.GOOD]: 'No precipitation expected',
        [Rating.FAIR]: 'Light precipitation possible',
        [Rating.POOR]: 'Heavy precipitation likely'
      },
      humidity: {
        [Rating.GOOD]: 'Humidity level is comfortable',
        [Rating.FAIR]: 'Humidity may cause some discomfort',
        [Rating.POOR]: 'High humidity makes activity strenuous'
      },
      aqi: {
        [Rating.GOOD]: 'Air quality is healthy',
        [Rating.FAIR]: 'Air quality is moderate',
        [Rating.POOR]: 'Poor air quality - limit outdoor exposure'
      }
    };

    return explanations[factor]?.[rating] || `${rating} conditions for ${factor}`;
  }

  getScoreDescription(score: number): string {
    if (score >= 80) return 'Excellent conditions for this activity';
    if (score >= 60) return 'Good conditions with minor considerations';
    if (score >= 40) return 'Fair conditions - check specific factors';
    if (score >= 20) return 'Poor conditions - consider alternatives';
    return 'Not recommended at this time';
  }
}