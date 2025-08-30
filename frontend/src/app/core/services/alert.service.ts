import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, interval, BehaviorSubject } from 'rxjs';
import { map, catchError, switchMap, shareReplay, startWith } from 'rxjs/operators';
import { NotificationService } from './notification.service';
import { environment } from '../../../environments/environment';

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

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private http = inject(HttpClient);
  private notificationService = inject(NotificationService);
  
  private alertsMap = new Map<string, BehaviorSubject<WeatherAlert[]>>();
  private previousAlerts = new Map<string, Set<string>>();
  private apiUrl = `${environment.apiUrl}/api/alerts`;
  
  fetchAlerts(locationId: string, lat: number, lon: number): Observable<WeatherAlert[]> {
    if (!this.alertsMap.has(locationId)) {
      this.alertsMap.set(locationId, new BehaviorSubject<WeatherAlert[]>([]));
      this.startAlertPolling(locationId, lat, lon);
    }
    
    return this.alertsMap.get(locationId)!.asObservable();
  }
  
  private startAlertPolling(locationId: string, lat: number, lon: number): void {
    interval(5 * 60 * 1000) // 5 minutes
      .pipe(
        startWith(0),
        switchMap(() => this.fetchAlertsFromApi(locationId, lat, lon)),
        shareReplay(1)
      )
      .subscribe(alerts => {
        const subject = this.alertsMap.get(locationId);
        if (subject) {
          subject.next(alerts);
          this.checkForNewWarnings(locationId, alerts);
        }
      });
  }
  
  private fetchAlertsFromApi(locationId: string, lat: number, lon: number): Observable<WeatherAlert[]> {
    return this.http.get<WeatherAlert[]>(
      `${this.apiUrl}/${locationId}?lat=${lat}&lon=${lon}`
    ).pipe(
      map(alerts => alerts.map(alert => ({
        ...alert,
        startTime: new Date(alert.startTime),
        endTime: new Date(alert.endTime)
      }))),
      catchError(err => {
        console.error('Failed to fetch alerts:', err);
        return of([]);
      })
    );
  }
  
  private checkForNewWarnings(locationId: string, alerts: WeatherAlert[]): void {
    const warnings = alerts.filter(a => a.alertType === AlertSeverity.WARNING);
    const previousIds = this.previousAlerts.get(locationId) || new Set();
    const currentIds = new Set(warnings.map(w => w.id));
    
    // Find new warnings
    warnings.forEach(warning => {
      if (!previousIds.has(warning.id)) {
        this.sendWarningNotification(warning);
      }
    });
    
    this.previousAlerts.set(locationId, currentIds);
  }
  
  private async sendWarningNotification(alert: WeatherAlert): Promise<void> {
    const hasPermission = await this.notificationService.requestPermission();
    if (!hasPermission) return;
    
    const settings = this.notificationService.getAlertSettings();
    if (!settings.enabled) return;
    
    // Check quiet hours
    const now = new Date();
    const currentHour = now.getHours();
    
    if (settings.quietHours.enabled) {
      const startHour = parseInt(settings.quietHours.start.split(':')[0]);
      const endHour = parseInt(settings.quietHours.end.split(':')[0]);
      
      const isQuietTime = startHour > endHour
        ? currentHour >= startHour || currentHour < endHour
        : currentHour >= startHour && currentHour < endHour;
      
      if (isQuietTime) return;
    }
    
    await this.notificationService.sendNotification(
      '⚠️ Weather Warning',
      alert.headline,
      {
        body: alert.description.substring(0, 200),
        icon: '/assets/icons/warning-icon.png',
        badge: '/assets/icons/badge-icon.png',
        tag: `weather-alert-${alert.id}`,
        requireInteraction: true,
        data: {
          alertId: alert.id,
          locationId: alert.locationId,
          type: 'weather-warning'
        }
      }
    );
  }
  
  getHistoricalAlerts(locationId: string): Observable<WeatherAlert[]> {
    return this.http.get<WeatherAlert[]>(
      `${this.apiUrl}/historical/${locationId}`
    ).pipe(
      map(alerts => alerts.map(alert => ({
        ...alert,
        startTime: new Date(alert.startTime),
        endTime: new Date(alert.endTime)
      }))),
      catchError(err => {
        console.error('Failed to fetch historical alerts:', err);
        return of([]);
      })
    );
  }
  
  clearAlerts(locationId: string): void {
    const subject = this.alertsMap.get(locationId);
    if (subject) {
      subject.next([]);
    }
    this.previousAlerts.delete(locationId);
  }
  
  clearAllAlerts(): void {
    this.alertsMap.forEach((subject) => subject.next([]));
    this.alertsMap.clear();
    this.previousAlerts.clear();
  }
}