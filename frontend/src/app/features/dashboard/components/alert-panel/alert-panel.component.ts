import { Component, Input, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { WeatherAlert, AlertSeverity } from '../alert-badge/alert-badge.component';

@Component({
  selector: 'app-alert-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatExpansionModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
  ],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(-10px)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateY(-10px)', opacity: 0 }))
      ])
    ])
  ],
  template: `
    @if (hasAlerts()) {
      <mat-accordion class="alert-accordion" [@slideIn]>
        @for (alert of alerts(); track alert.id) {
          <mat-expansion-panel [expanded]="isFirstWarning(alert)">
            <mat-expansion-panel-header>
              <mat-panel-title>
                <mat-icon [style.color]="getAlertColor(alert.alertType)" class="alert-icon">
                  {{ getAlertIcon(alert.alertType) }}
                </mat-icon>
                <span class="alert-headline">{{ alert.headline }}</span>
              </mat-panel-title>
              <mat-panel-description>
                <mat-chip-listbox class="severity-chip">
                  <mat-chip [style.background-color]="getAlertColor(alert.alertType)" [style.color]="'white'">
                    {{ alert.alertType.toUpperCase() }}
                  </mat-chip>
                </mat-chip-listbox>
              </mat-panel-description>
            </mat-expansion-panel-header>
            
            <div class="alert-content">
              <p class="alert-description">{{ alert.description }}</p>
              
              <mat-divider></mat-divider>
              
              <div class="alert-metadata">
                <div class="time-info">
                  <mat-icon>schedule</mat-icon>
                  <span>
                    Valid from {{ formatTime(alert.startTime) }} to {{ formatTime(alert.endTime) }}
                  </span>
                </div>
                
                <div class="source-info">
                  <mat-icon>info_outline</mat-icon>
                  <span>Source: {{ alert.source }}</span>
                </div>
              </div>
            </div>
          </mat-expansion-panel>
        }
      </mat-accordion>
    }
  `,
  styles: [`
    .alert-accordion {
      margin-top: 16px;
      width: 100%;
    }
    
    .alert-icon {
      margin-right: 8px;
      vertical-align: middle;
    }
    
    .alert-headline {
      font-weight: 500;
      vertical-align: middle;
    }
    
    .severity-chip {
      margin-left: auto;
    }
    
    .alert-content {
      padding: 16px;
    }
    
    .alert-description {
      margin: 0 0 16px 0;
      line-height: 1.5;
      color: var(--mat-expansion-container-text-color);
    }
    
    .alert-metadata {
      margin-top: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 14px;
      color: var(--mat-expansion-container-text-color);
      opacity: 0.8;
    }
    
    .time-info,
    .source-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .time-info mat-icon,
    .source-info mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    
    mat-expansion-panel {
      margin-bottom: 8px;
    }
    
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class AlertPanelComponent {
  @Input() set alertList(value: WeatherAlert[]) {
    this.alerts.set(value || []);
  }

  alerts = signal<WeatherAlert[]>([]);
  
  hasAlerts() {
    return this.alerts().length > 0;
  }
  
  isFirstWarning(alert: WeatherAlert): boolean {
    const warnings = this.alerts().filter(a => a.alertType === AlertSeverity.WARNING);
    return warnings.length > 0 && warnings[0].id === alert.id;
  }
  
  getAlertIcon(severity: AlertSeverity): string {
    switch (severity) {
      case AlertSeverity.WARNING:
        return 'error';
      case AlertSeverity.WATCH:
        return 'warning';
      case AlertSeverity.ADVISORY:
        return 'info';
      default:
        return 'info';
    }
  }
  
  getAlertColor(severity: AlertSeverity): string {
    switch (severity) {
      case AlertSeverity.WARNING:
        return '#f44336';
      case AlertSeverity.WATCH:
        return '#ff9800';
      case AlertSeverity.ADVISORY:
        return '#2196f3';
      default:
        return '#757575';
    }
  }
  
  formatTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(d);
  }
}