import { Injectable, inject, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { interval, Subject, switchMap, takeUntil, catchError, of } from 'rxjs';
import { LocationService } from './location.service';
import { NotificationService } from './notification.service';
import { environment } from '../../../environments/environment';
import { WeatherLocation } from '@shared/models/location.model';

export interface PrecipitationAlert {
  locationId: string;
  lat: number;
  lon: number;
  minutesToStart: number;
  precipitationType: 'rain' | 'snow' | 'sleet';
  intensity: 'light' | 'moderate' | 'heavy';
  estimatedDuration: number;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root',
})
export class PrecipitationAlertService {
  private http = inject(HttpClient);
  private locationService = inject(LocationService);
  private notificationService = inject(NotificationService);
  
  private destroy$ = new Subject<void>();
  private readonly POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes
  
  activeAlerts = signal<Map<string, PrecipitationAlert>>(new Map());
  isMonitoring = signal(false);
  lastCheckTime = signal<Date | null>(null);
  
  // Initialize effect in field initializer to ensure it's in injection context
  private monitoringEffect = effect(() => {
    const locations = this.locationService.locations();
    if (locations.length > 0 && this.notificationService.preferences().enabled) {
      this.startMonitoring();
    } else if (locations.length === 0) {
      this.stopMonitoring();
    }
  });

  constructor() {
    // Effect is now initialized as a field, no longer needed here
  }

  startMonitoring(): void {
    if (this.isMonitoring()) {
      return;
    }

    this.isMonitoring.set(true);
    
    // Initial check
    this.checkAllLocations();
    
    // Set up polling
    interval(this.POLL_INTERVAL)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.checkAllLocations()),
      )
      .subscribe();
  }

  stopMonitoring(): void {
    this.isMonitoring.set(false);
    this.destroy$.next();
  }

  private async checkAllLocations(): Promise<void> {
    const locations = this.locationService.locations();
    if (locations.length === 0) {
      return;
    }

    const locationsData = locations.map((loc: WeatherLocation) => ({
      id: loc.id,
      lat: loc.latitude,
      lon: loc.longitude,
    }));

    try {
      const response = await this.http
        .post<{ alerts: PrecipitationAlert[]; count: number }>(
          `${environment.apiUrl}/precipitation/check-multiple`,
          { locations: locationsData },
        )
        .toPromise();

      if (response && response.alerts) {
        this.processAlerts(response.alerts, locations);
      }
      
      this.lastCheckTime.set(new Date());
    } catch (error) {
      console.error('Failed to check precipitation:', error);
    }
  }

  private processAlerts(
    alerts: PrecipitationAlert[],
    locations: WeatherLocation[],
  ): void {
    const newAlerts = new Map<string, PrecipitationAlert>();
    
    for (const alert of alerts) {
      const location = locations.find((loc) => loc.id === alert.locationId);
      if (!location) continue;
      
      // Check if alerts are enabled for this location
      const settings = this.getAlertSettings(alert.locationId);
      if (!settings?.enabled) continue;
      
      // Check if this is a new alert
      const existingAlert = this.activeAlerts().get(alert.locationId);
      if (!existingAlert || 
          existingAlert.minutesToStart !== alert.minutesToStart) {
        // New or updated alert - send notification
        this.notificationService.showPrecipitationAlert({
          locationId: alert.locationId,
          locationName: location.name,
          minutesToStart: alert.minutesToStart,
          precipitationType: this.formatPrecipitationType(alert.precipitationType),
          intensity: this.formatIntensity(alert.intensity),
          estimatedDuration: alert.estimatedDuration,
        });
      }
      
      newAlerts.set(alert.locationId, alert);
    }
    
    this.activeAlerts.set(newAlerts);
  }

  private formatPrecipitationType(type: string): string {
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  private formatIntensity(intensity: string): string {
    return intensity.charAt(0).toUpperCase() + intensity.slice(1);
  }

  async checkSingleLocation(lat: number, lon: number, locationId: string): Promise<PrecipitationAlert | null> {
    try {
      const response = await this.http
        .get<{ hasAlert: boolean; alert: PrecipitationAlert | null }>(
          `${environment.apiUrl}/precipitation/check`,
          {
            params: {
              lat: lat.toString(),
              lon: lon.toString(),
              locationId,
            },
          },
        )
        .toPromise();

      return response?.alert || null;
    } catch (error) {
      console.error('Failed to check precipitation for location:', error);
      return null;
    }
  }

  getAlertForLocation(locationId: string): PrecipitationAlert | undefined {
    return this.activeAlerts().get(locationId);
  }

  hasActiveAlert(locationId: string): boolean {
    return this.activeAlerts().has(locationId);
  }

  clearAlert(locationId: string): void {
    const alerts = new Map(this.activeAlerts());
    alerts.delete(locationId);
    this.activeAlerts.set(alerts);
  }

  async clearCooldown(locationId: string): Promise<void> {
    try {
      await this.http
        .post(`${environment.apiUrl}/precipitation/cooldown/${locationId}/clear`, {})
        .toPromise();
    } catch (error) {
      console.error('Failed to clear cooldown:', error);
    }
  }
  
  getAlertSettings(locationId: string): { enabled: boolean } | null {
    const settings = localStorage.getItem(`alert-settings-${locationId}`);
    if (settings) {
      return JSON.parse(settings);
    }
    return { enabled: true }; // Default to enabled
  }
  
  updateAlertSettings(locationId: string, settings: { enabled: boolean }): void {
    localStorage.setItem(`alert-settings-${locationId}`, JSON.stringify(settings));
    
    // If alerts are disabled for this location, clear any active alerts
    if (!settings.enabled) {
      this.clearAlert(locationId);
    }
  }
}