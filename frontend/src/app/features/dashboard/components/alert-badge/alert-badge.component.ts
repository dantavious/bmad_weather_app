import { Component, Input, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatBadgeModule } from '@angular/material/badge';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { ThemePalette } from '@angular/material/core';

export enum AlertSeverity {
  WARNING = 'warning',
  WATCH = 'watch',
  ADVISORY = 'advisory',
}

export interface WeatherAlert {
  id: string;
  locationId: string;
  alertType: AlertSeverity;
  headline: string;
  description: string;
  startTime: Date;
  endTime: Date;
  source: string;
  isActive: boolean;
}

@Component({
  selector: 'app-alert-badge',
  standalone: true,
  imports: [
    CommonModule,
    MatBadgeModule,
    MatIconModule,
    MatTooltipModule,
    MatButtonModule,
  ],
  template: `
    @if (hasAlerts()) {
      <button 
        mat-icon-button 
        [matBadge]="alertCount()" 
        [matBadgeColor]="getBadgeColor()"
        [matBadgeSize]="'small'"
        [matTooltip]="getTooltipText()"
        (click)="onAlertClick()"
        class="alert-badge-button">
        <mat-icon [style.color]="getIconColor()">warning</mat-icon>
      </button>
    }
  `,
  styles: [`
    .alert-badge-button {
      position: absolute;
      top: 8px;
      right: 8px;
      z-index: 10;
    }
    
    :host {
      display: contents;
    }
  `]
})
export class AlertBadgeComponent {
  @Input() set alerts(value: WeatherAlert[]) {
    this._alerts.set(value || []);
  }

  private _alerts = signal<WeatherAlert[]>([]);
  
  hasAlerts = computed(() => this._alerts().length > 0);
  alertCount = computed(() => {
    const count = this._alerts().length;
    return count > 9 ? '9+' : count.toString();
  });
  
  highestSeverity = computed(() => {
    const alerts = this._alerts();
    if (alerts.some(a => a.alertType === AlertSeverity.WARNING)) {
      return AlertSeverity.WARNING;
    }
    if (alerts.some(a => a.alertType === AlertSeverity.WATCH)) {
      return AlertSeverity.WATCH;
    }
    if (alerts.some(a => a.alertType === AlertSeverity.ADVISORY)) {
      return AlertSeverity.ADVISORY;
    }
    return null;
  });

  getBadgeColor(): ThemePalette {
    const severity = this.highestSeverity();
    switch (severity) {
      case AlertSeverity.WARNING:
        return 'warn';
      case AlertSeverity.WATCH:
        return 'accent';
      case AlertSeverity.ADVISORY:
        return 'primary';
      default:
        return 'primary';
    }
  }

  getIconColor(): string {
    const severity = this.highestSeverity();
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

  getTooltipText(): string {
    const alerts = this._alerts();
    if (!alerts.length) return '';
    
    const severity = this.highestSeverity();
    const count = alerts.length;
    
    if (count === 1) {
      return alerts[0].headline;
    }
    
    const severityText = severity ? severity.charAt(0).toUpperCase() + severity.slice(1) : 'Alert';
    return `${count} active ${severityText}${count > 1 ? 's' : ''}. Click for details.`;
  }

  onAlertClick(): void {
    const event = new CustomEvent('alertClick', {
      detail: { alerts: this._alerts() },
      bubbles: true,
      composed: true
    });
    document.dispatchEvent(event);
  }
}