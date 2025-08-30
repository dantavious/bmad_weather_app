import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

interface WeatherPopupData {
  location: string;
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
  icon: string;
}

@Component({
  selector: 'app-weather-popup',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <mat-card class="weather-popup">
      <mat-card-header>
        <mat-card-title>{{ data.location }}</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div class="weather-info">
          <div class="temperature">
            <span class="temp-value">{{ data.temperature }}°</span>
            <span class="description">{{ data.description }}</span>
          </div>
          <div class="details">
            <div class="detail-item">
              <mat-icon>water_drop</mat-icon>
              <span>{{ data.humidity }}%</span>
            </div>
            <div class="detail-item">
              <mat-icon>air</mat-icon>
              <span>{{ data.windSpeed }} mph</span>
            </div>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .weather-popup {
      min-width: 250px;
      max-width: 300px;
    }
    
    .weather-info {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .temperature {
      display: flex;
      flex-direction: column;
      align-items: center;
      
      .temp-value {
        font-size: 36px;
        font-weight: 500;
        color: var(--mat-sys-primary);
      }
      
      .description {
        font-size: 14px;
        color: var(--mat-sys-on-surface-variant);
        text-transform: capitalize;
      }
    }
    
    .details {
      display: flex;
      justify-content: space-around;
      padding-top: 8px;
      border-top: 1px solid var(--mat-sys-outline-variant);
      
      .detail-item {
        display: flex;
        align-items: center;
        gap: 4px;
        
        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
          color: var(--mat-sys-on-surface-variant);
        }
        
        span {
          font-size: 14px;
          color: var(--mat-sys-on-surface);
        }
      }
    }
  `]
})
export class WeatherPopupComponent {
  @Input() data!: WeatherPopupData;
}