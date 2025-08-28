import { Component, Input, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';
import { WeatherLocation } from '@shared/models/location.model';
import { WeatherForecast } from '@shared/models/weather.model';
import { WeatherService } from '../../../../core/services/weather.service';
import { SettingsService } from '../../../../core/services/settings.service';
import { LoadingSkeletonComponent } from '../../../../shared/components/loading-skeleton/loading-skeleton.component';

@Component({
  selector: 'app-weather-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    LoadingSkeletonComponent
  ],
  template: `
    <mat-card class="weather-card" [class.loading]="loading()">
      @if (loading()) {
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
          <button mat-button (click)="loadWeather()">Retry</button>
        </mat-card-content>
      } @else if (weather()) {
        <mat-card-header>
          <mat-card-title>{{ location.name }}</mat-card-title>
          @if (location.isPrimary) {
            <mat-icon class="primary-badge">star</mat-icon>
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
        </mat-card-content>
      }
    </mat-card>
  `,
  styles: [`
    .weather-card {
      height: 100%;
      min-height: 200px;
      transition: transform 0.2s, box-shadow 0.2s;
      background: var(--mat-app-surface-container);
    }
    
    .weather-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
    }
    
    .weather-card.loading {
      opacity: 0.7;
    }
    
    mat-card-header {
      position: relative;
    }
    
    .primary-badge {
      position: absolute;
      top: 16px;
      right: 16px;
      color: var(--mdc-theme-primary);
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
  `]
})
export class WeatherCardComponent implements OnInit, OnDestroy {
  @Input({ required: true }) location!: WeatherLocation;
  
  private weatherService = inject(WeatherService);
  private settingsService = inject(SettingsService);
  private destroy$ = new Subject<void>();
  
  weather = signal<WeatherForecast | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  
  ngOnInit() {
    this.loadWeather();
    this.subscribeToWeatherUpdates();
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
}