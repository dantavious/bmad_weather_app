import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="dashboard-container">
      <h1>Welcome to DatDude Weather</h1>
      
      <div class="cards-grid">
        <mat-card>
          <mat-card-header>
            <mat-card-title>
              <mat-icon>location_on</mat-icon>
              Current Location
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>Weather data will be displayed here</p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-button color="primary">VIEW DETAILS</button>
          </mat-card-actions>
        </mat-card>
        
        <mat-card>
          <mat-card-header>
            <mat-card-title>
              <mat-icon>schedule</mat-icon>
              Forecast
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>5-day forecast coming soon</p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-button color="primary">VIEW FORECAST</button>
          </mat-card-actions>
        </mat-card>
        
        <mat-card>
          <mat-card-header>
            <mat-card-title>
              <mat-icon>warning</mat-icon>
              Alerts
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>No active weather alerts</p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-button color="primary">VIEW ALL</button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 20px 0;
    }
    
    h1 {
      font-size: 2rem;
      margin-bottom: 24px;
      color: var(--mat-sys-on-surface);
    }
    
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }
    
    mat-card {
      background-color: var(--mat-app-surface-container);
    }
    
    mat-card-header mat-icon {
      margin-right: 8px;
      vertical-align: middle;
    }
    
    mat-card-title {
      display: flex;
      align-items: center;
    }
  `]
})
export class DashboardComponent {}