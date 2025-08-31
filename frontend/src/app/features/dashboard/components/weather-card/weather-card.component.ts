import { Component, Input, inject, OnInit, OnDestroy, signal, Output, EventEmitter, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Subject, takeUntil } from 'rxjs';
import { WeatherLocation } from '@shared/models/location.model';
import { WeatherForecast, DailyWeather } from '@shared/models/weather.model';
import { WeatherService } from '../../../../core/services/weather.service';
import { SettingsService } from '../../../../core/services/settings.service';
import { PrecipitationAlertService } from '../../../../core/services/precipitation-alert.service';
import { LocationService } from '../../../../core/services/location.service';
import { LoadingSkeletonComponent } from '../../../../shared/components/loading-skeleton/loading-skeleton.component';
import { AlertBadgeComponent, WeatherAlert } from '../alert-badge/alert-badge.component';
import { ActivityChipsComponent } from '../activity-chips/activity-chips.component';
import { ActivityDetailsComponent } from '../activity-details/activity-details.component';
import { ActivityRecommendation, ActivityType } from '@shared/models/activity.model';
import { ActivityService } from '../../../../core/services/activity.service';

@Component({
  selector: 'app-weather-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatBadgeModule,
    MatTooltipModule,
    MatSlideToggleModule,
    LoadingSkeletonComponent,
    AlertBadgeComponent,
    ActivityChipsComponent,
    ActivityDetailsComponent
  ],
  animations: [
    trigger('flipState', [
      state('active', style({
        transform: 'rotateY(179deg)'
      })),
      state('inactive', style({
        transform: 'rotateY(0)'
      })),
      transition('active => inactive', animate('600ms ease-out')),
      transition('inactive => active', animate('600ms ease-in'))
    ])
  ],
  template: `
    <div class="flip-card-container" 
      [style.min-height.px]="flip === 'active' ? 450 : 280"
      (click)="toggleFlip()"
      (touchstart)="onTouchStart($event)"
      (touchend)="onTouchEnd($event)">
      
      <div class="flip-card-inner" 
        [@flipState]="flip"
        [class.flipped]="flip === 'active'">
        <!-- Front side - Current Weather -->
        <mat-card class="flip-card-front" [class.loading]="loading()">
          @if (loading() && !weather()) {
            <app-loading-skeleton 
              [height]="'250px'"
              [animate]="true"
              [lines]="[
                { width: '50%', height: '24px' },
                { width: '100%', height: '48px' },
                { width: '70%', height: '20px' },
                { width: '100%', height: '1px' },
                { width: '90%', height: '16px' }
              ]">
            </app-loading-skeleton>
          } @else if (error()) {
            <mat-card-content class="error-content">
              <mat-icon color="warn">error</mat-icon>
              <p>{{ error() }}</p>
              <button mat-button (click)="handleRetry($event)">Retry</button>
            </mat-card-content>
          } @else if (weather()) {
            <app-alert-badge [alerts]="alerts()"></app-alert-badge>
            <mat-card-header>
              <mat-card-title>
                {{ location.name }}
              </mat-card-title>
              @if (location.isPrimary) {
                <mat-icon class="primary-badge" title="Primary Location">star</mat-icon>
              }
            </mat-card-header>
            <mat-card-content class="weather-content">
              <div class="temperature-display">
                <mat-icon class="weather-icon">{{ getWeatherIcon(weather()!.current.icon) }}</mat-icon>
                <span class="temperature">
                  {{ formatTemperature(weather()!.current.temperature) }}°{{ getUnitSymbol() }}
                </span>
              </div>
              <div class="weather-description">
                {{ weather()!.current.description }}
              </div>
              <div class="weather-details">
                <div class="detail-item">
                  <mat-icon>water_drop</mat-icon>
                  <span>{{ weather()!.current.humidity }}%</span>
                </div>
                <div class="detail-item">
                  <mat-icon>air</mat-icon>
                  <span>{{ formatWindSpeed(weather()!.current.windSpeed) }} {{ getSpeedUnit() }}</span>
                </div>
                <div class="detail-item">
                  <mat-icon>thermostat</mat-icon>
                  <span>Feels like {{ formatTemperature(weather()!.current.feelsLike) }}°</span>
                </div>
              </div>
              <div class="alert-toggle">
                <mat-slide-toggle
                  [checked]="alertsEnabled()"
                  (change)="toggleAlerts($event)"
                  [matTooltip]="alertsEnabled() ? 'Precipitation alerts enabled' : 'Precipitation alerts disabled'"
                  (click)="$event.stopPropagation()">
                  <mat-icon>{{ alertsEnabled() ? 'notifications_active' : 'notifications_off' }}</mat-icon>
                  Alerts
                </mat-slide-toggle>
              </div>
              @if (activitySettings()?.showActivities && activityRecommendations().length > 0) {
                <app-activity-chips
                  [recommendations]="activityRecommendations()"
                  [settings]="activitySettings()"
                  (activitySelected)="onActivitySelected($event)"
                  (click)="$event.stopPropagation()">
                </app-activity-chips>
                @if (selectedActivity()) {
                  <app-activity-details
                    [inputRecommendation]="selectedActivity()!"
                    (click)="$event.stopPropagation()">
                  </app-activity-details>
                }
              }
            </mat-card-content>
          }
        </mat-card>
        
        <!-- Back side - 7-Day Forecast -->
        <mat-card class="flip-card-back">
          @if (loadingForecast()) {
            <mat-card-content class="loading-content">
              <mat-spinner diameter="40"></mat-spinner>
              <p>Loading forecast...</p>
            </mat-card-content>
          } @else if (forecastError()) {
            <mat-card-content class="error-content">
              <mat-icon color="warn">error</mat-icon>
              <p>{{ forecastError() }}</p>
              <button mat-button (click)="handleRetryForecast($event)">Retry</button>
            </mat-card-content>
          } @else if (forecast() && forecast().length > 0) {
            <mat-card-header>
              <mat-card-title>7-Day Forecast</mat-card-title>
            </mat-card-header>
            <mat-card-content class="forecast-content">
              @for (day of forecast(); track day.date.toString()) {
                <div class="forecast-day">
                  <span class="day-name">{{ getDayName(day.date) }}</span>
                  <mat-icon class="day-icon">{{ getWeatherIcon(day.icon) }}</mat-icon>
                  <div class="day-temps">
                    <span class="temp-high">{{ formatTemperature(day.temperatureMax) }}°</span>
                    <span class="temp-low">{{ formatTemperature(day.temperatureMin) }}°</span>
                  </div>
                  @if (day.precipitationProbability > 0) {
                    <div class="precipitation">
                      <mat-icon>water_drop</mat-icon>
                      <span>{{ day.precipitationProbability }}%</span>
                    </div>
                  }
                </div>
              }
            </mat-card-content>
          } @else {
            <mat-card-content class="no-forecast">
              <mat-icon>cloud_off</mat-icon>
              <p>No forecast available</p>
            </mat-card-content>
          }
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .flip-card-container {
      width: 100%;
      min-height: 320px;
      perspective: 1000px;
      cursor: pointer;
      transition: min-height 0.3s ease;
      position: relative;
    }
    
    .flip-card-inner {
      position: relative;
      width: 100%;
      height: 100%;
      min-height: 320px;
      transform-style: preserve-3d;
      transition: min-height 0.3s ease;
    }
    
    .flip-card-inner.flipped {
      min-height: 450px; /* Accommodate 7-day forecast */
    }
    
    .flip-card-front,
    .flip-card-back {
      width: 100%;
      min-height: 320px;
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
      position: absolute;
      top: 0;
      left: 0;
      transition: box-shadow 0.2s;
      display: block;
    }
    
    .flip-card-back {
      min-height: 450px; /* Ensure forecast has enough space */
    }
    
    .flip-card-front {
      z-index: 2;
    }
    
    .flip-card-back {
      transform: rotateY(180deg);
      z-index: 1;
    }
    
    mat-card {
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    
    .flip-card-front.loading {
      opacity: 0.7;
    }
    
    .flip-card-container:hover .flip-card-front,
    .flip-card-container:hover .flip-card-back {
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
    }
    
    .flip-card-front::after {
      content: '↻';
      position: absolute;
      bottom: 8px;
      right: 8px;
      font-size: 18px;
      opacity: 0.3;
      transition: opacity 0.2s;
      color: var(--mdc-theme-on-surface);
    }
    
    .flip-card-container:hover .flip-card-front::after {
      opacity: 0.6;
    }
    
    mat-card-header {
      position: relative;
    }
    
    .primary-badge {
      position: absolute;
      top: 16px;
      right: 16px;
      color: #ffd700;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    
    .loading-content,
    .error-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      text-align: center;
    }
    
    .error-content mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }
    
    .weather-content {
      padding: 20px;
    }
    
    .temperature-display {
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 20px 0;
    }
    
    .weather-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-right: 16px;
      color: var(--mdc-theme-primary);
    }
    
    .temperature {
      font-size: 48px;
      font-weight: 300;
      color: var(--mdc-theme-on-surface);
    }
    
    .weather-description {
      text-align: center;
      font-size: 18px;
      text-transform: capitalize;
      margin-bottom: 20px;
      color: var(--mdc-theme-on-surface);
      opacity: 0.8;
    }
    
    .weather-details {
      display: flex;
      justify-content: space-around;
      padding-top: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.12);
    }
    
    .detail-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .detail-item mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: var(--mdc-theme-on-surface);
      opacity: 0.7;
    }
    
    .detail-item span {
      font-size: 14px;
      color: var(--mdc-theme-on-surface);
    }
    
    /* Forecast styles */
    .forecast-content {
      padding: 16px;
      max-height: 400px;
      overflow-y: auto;
    }
    
    .forecast-content::-webkit-scrollbar {
      width: 4px;
    }
    
    .forecast-content::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.05);
    }
    
    .forecast-content::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 2px;
    }
    
    .forecast-day {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .forecast-day:last-child {
      border-bottom: none;
    }
    
    .day-name {
      flex: 0 0 80px;
      font-weight: 500;
    }
    
    .day-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
      color: var(--mdc-theme-primary);
      margin: 0 12px;
    }
    
    .day-temps {
      display: flex;
      gap: 8px;
      flex: 1;
      justify-content: center;
    }
    
    .temp-high {
      font-weight: 500;
    }
    
    .temp-low {
      opacity: 0.7;
    }
    
    .precipitation {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 14px;
      color: var(--mdc-theme-primary);
    }
    
    .precipitation mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
    
    .no-forecast {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      text-align: center;
      opacity: 0.7;
    }
    
    .no-forecast mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }
    
    .alert-indicator {
      animation: pulse 2s infinite;
      font-size: 20px;
      width: 20px;
      height: 20px;
      margin-left: 8px;
      vertical-align: middle;
    }
    
    @keyframes pulse {
      0% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
      100% {
        opacity: 1;
      }
    }
    
    .alert-toggle {
      margin-top: auto;
      padding-top: 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.12);
      display: flex;
      justify-content: center;
      padding-bottom: 8px;
    }
    
    .alert-toggle mat-slide-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .alert-toggle mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    
    mat-card-content {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
  `]
})
export class WeatherCardComponent implements OnInit, OnDestroy {
  @Input({ required: true }) location!: WeatherLocation;
  @Input() isFlipped = signal(false);
  @Output() flipped = new EventEmitter<boolean>();
  @Output() activityDetailsRequested = new EventEmitter<ActivityRecommendation>();
  
  private weatherService = inject(WeatherService);
  private settingsService = inject(SettingsService);
  private alertService = inject(PrecipitationAlertService);
  private locationService = inject(LocationService);
  private activityService = inject(ActivityService);
  private destroy$ = new Subject<void>();
  
  weather = signal<WeatherForecast | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  
  forecast = signal<DailyWeather[]>([]);
  loadingForecast = signal(false);
  forecastError = signal<string | null>(null);
  
  // Precipitation alert
  hasAlert = signal(false);
  alertInfo = signal<any>(null);
  alertsEnabled = signal(false);
  
  // Weather alerts from NWS
  alerts = signal<WeatherAlert[]>([]);
  
  // Activity recommendations
  activityRecommendations = signal<ActivityRecommendation[]>([]);
  activitySettings = signal(this.settingsService.getActivitySettings());
  selectedActivity = signal<ActivityRecommendation | null>(null);
  
  // Watch for alert changes - initialize as field to be in injection context
  private alertWatcher = effect(() => {
    // Only run if location is available
    if (this.location) {
      const alert = this.alertService.getAlertForLocation(this.location.id);
      this.hasAlert.set(!!alert);
      this.alertInfo.set(alert);
      
      // Also update NWS alerts
      const nwsAlertsSignal = this.locationService.getAlertsForLocation(this.location.id);
      this.alerts.set(nwsAlertsSignal());
    }
  });
  
  // Animation state
  flip: string = 'inactive';
  
  // Touch gesture tracking
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchStartTime: number = 0;
  
  ngOnInit() {
    this.loadWeather();
    this.subscribeToWeatherUpdates();
    this.checkForAlerts();
    this.loadAlertSettings();
    this.loadActivityRecommendations();
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadWeather() {
    const units = this.settingsService.getUnits();
    this.loading.set(true);
    this.error.set(null);
    
    this.weatherService.getCurrentWeatherByCoordinates(
      this.location.latitude,
      this.location.longitude,
      units
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data) => {
        this.weather.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading weather:', err);
        this.error.set('Failed to load weather data');
        this.loading.set(false);
      }
    });
  }
  
  loadForecast() {
    if (this.forecast().length > 0) return; // Already loaded
    
    const units = this.settingsService.getUnits();
    this.loadingForecast.set(true);
    this.forecastError.set(null);
    
    this.weatherService.getForecast(
      this.location.latitude,
      this.location.longitude,
      units
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data) => {
        this.forecast.set(data);
        this.loadingForecast.set(false);
      },
      error: (err) => {
        console.error('Error loading forecast:', err);
        this.forecastError.set('Failed to load forecast');
        this.loadingForecast.set(false);
      }
    });
  }
  
  toggleFlip() {
    this.flip = (this.flip === 'inactive') ? 'active' : 'inactive';
    const newState = this.flip === 'active';
    this.isFlipped.set(newState);
    this.flipped.emit(newState);
    
    // Load forecast when flipping to back
    if (newState) {
      this.loadForecast();
    }
  }
  
  onTouchStart(event: TouchEvent) {
    if (event.touches.length !== 1) return; // Only handle single touch
    
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
    this.touchStartTime = Date.now();
  }
  
  onTouchEnd(event: TouchEvent) {
    if (event.changedTouches.length !== 1) return;
    
    const touchEndX = event.changedTouches[0].clientX;
    const touchEndY = event.changedTouches[0].clientY;
    const touchEndTime = Date.now();
    
    // Calculate swipe distance and time
    const deltaX = touchEndX - this.touchStartX;
    const deltaY = touchEndY - this.touchStartY;
    const deltaTime = touchEndTime - this.touchStartTime;
    
    // Swipe detection thresholds
    const minSwipeDistance = 50; // minimum pixels
    const maxSwipeTime = 300; // maximum milliseconds
    const maxVerticalDistance = 100; // maximum vertical movement
    
    // Check if it's a horizontal swipe
    if (
      Math.abs(deltaX) > minSwipeDistance &&
      Math.abs(deltaY) < maxVerticalDistance &&
      deltaTime < maxSwipeTime
    ) {
      event.preventDefault(); // Prevent click event
      this.toggleFlip();
    }
  }
  
  handleRetry(event: Event) {
    event.stopPropagation();
    this.loadWeather();
  }
  
  handleRetryForecast(event: Event) {
    event.stopPropagation();
    this.loadForecast();
  }
  
  private subscribeToWeatherUpdates() {
    this.weatherService.getWeatherObservable(
      this.location.latitude,
      this.location.longitude
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe(data => {
      if (data) {
        this.weather.set(data);
      }
    });
    
    this.weatherService.getLoadingState(
      this.location.latitude,
      this.location.longitude
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe(loading => this.loading.set(loading));
    
    this.weatherService.getErrorState(
      this.location.latitude,
      this.location.longitude
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe(error => this.error.set(error));
  }
  
  formatTemperature(temp: number): string {
    return Math.round(temp).toString();
  }
  
  formatWindSpeed(speed: number): string {
    return Math.round(speed).toString();
  }
  
  getUnitSymbol(): string {
    return this.settingsService.getUnits() === 'imperial' ? 'F' : 'C';
  }
  
  getSpeedUnit(): string {
    return this.settingsService.getUnits() === 'imperial' ? 'mph' : 'km/h';
  }
  
  getWeatherIcon(iconCode: string): string {
    const iconMap: { [key: string]: string } = {
      '01d': 'wb_sunny',
      '01n': 'nightlight',
      '02d': 'wb_cloudy',
      '02n': 'cloud',
      '03d': 'cloud',
      '03n': 'cloud',
      '04d': 'cloud',
      '04n': 'cloud',
      '09d': 'water_drop',
      '09n': 'water_drop',
      '10d': 'umbrella',
      '10n': 'umbrella',
      '11d': 'thunderstorm',
      '11n': 'thunderstorm',
      '13d': 'ac_unit',
      '13n': 'ac_unit',
      '50d': 'foggy',
      '50n': 'foggy'
    };
    return iconMap[iconCode] || 'cloud';
  }
  
  getDayName(date: Date): string {
    const dateObj = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (dateObj.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (dateObj.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    }
  }
  
  private checkForAlerts(): void {
    const alert = this.alertService.getAlertForLocation(this.location.id);
    this.hasAlert.set(!!alert);
    this.alertInfo.set(alert);
  }
  
  getAlertTooltip(): string {
    const alert = this.alertInfo();
    if (!alert) return '';
    
    const type = alert.precipitationType === 'rain' ? 'Rain' : 
                 alert.precipitationType === 'snow' ? 'Snow' : 'Precipitation';
    const intensity = alert.intensity.charAt(0).toUpperCase() + alert.intensity.slice(1);
    
    return `${intensity} ${type} starting in ${alert.minutesToStart} minutes`;
  }
  
  private loadActivityRecommendations(): void {
    const units = this.settingsService.getUnits();
    const activitySettings = this.settingsService.getActivitySettings();
    
    // Ensure we have proper defaults if settings are missing
    const settingsWithDefaults = activitySettings || {
      showActivities: true,
      enabledActivities: Object.values(ActivityType),
      showBestHours: true
    };
    
    // Update the local signal with settings
    this.activitySettings.set(settingsWithDefaults);
    
    // Only fetch if showActivities is true
    if (settingsWithDefaults.showActivities) {
      this.activityService.getRecommendations(
        this.location.latitude,
        this.location.longitude,
        units,
        settingsWithDefaults
      ).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (recommendations) => {
          this.activityRecommendations.set(recommendations);
          console.log('Activity recommendations loaded:', recommendations);
        },
        error: (err) => {
          console.error('Error loading activity recommendations:', err);
          this.activityRecommendations.set([]);
        }
      });
    } else {
      console.log('Activity recommendations disabled in settings');
    }
  }
  
  onActivitySelected(activity: ActivityRecommendation): void {
    this.selectedActivity.set(activity);
    this.activityDetailsRequested.emit(activity);
  }
  
  loadAlertSettings(): void {
    const settings = this.alertService.getAlertSettings(this.location.id);
    this.alertsEnabled.set(settings?.enabled || false);
  }
  
  toggleAlerts(event: any): void {
    event.stopPropagation();
    const enabled = event.checked;
    this.alertsEnabled.set(enabled);
    this.alertService.updateAlertSettings(this.location.id, { enabled });
  }
}