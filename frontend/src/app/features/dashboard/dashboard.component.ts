import { Component, OnInit, OnDestroy, inject, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Subject, takeUntil } from 'rxjs';
import { LocationService } from '../../core/services/location.service';
import { WeatherCardComponent } from './components/weather-card/weather-card.component';
import { WeatherLocation } from '@shared/models/location.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    WeatherCardComponent
  ],
  template: `
    <div class="dashboard-container">
      <header class="dashboard-header">
        <h1>Weather Dashboard</h1>
        @if (loading()) {
          <mat-progress-bar mode="indeterminate"></mat-progress-bar>
        }
      </header>
      
      @if (error()) {
        <mat-card class="error-card">
          <mat-card-content>
            <mat-icon color="warn">error_outline</mat-icon>
            <p>{{ error() }}</p>
            <button mat-button color="primary" (click)="loadLocations()">
              <mat-icon>refresh</mat-icon>
              Retry
            </button>
          </mat-card-content>
        </mat-card>
      }
      
      @if (locations().length > 0) {
        <div class="locations-grid">
          @for (location of locations(); track location.id) {
            <app-weather-card 
              [location]="location"
              [isFlipped]="getFlipState(location.id)"
              (flipped)="onCardFlipped(location.id, $event)"
            ></app-weather-card>
          }
        </div>
      } @else if (!loading() && !error()) {
        <mat-card class="empty-state">
          <mat-card-content>
            <mat-icon>location_off</mat-icon>
            <h2>No Locations Added</h2>
            <p>Add your first location to start tracking weather</p>
            <button mat-raised-button color="primary">
              <mat-icon>add_location</mat-icon>
              Add Location
            </button>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }
    
    .dashboard-header {
      margin-bottom: 32px;
    }
    
    .dashboard-header h1 {
      font-size: 2.5rem;
      font-weight: 300;
      margin: 0 0 16px 0;
      color: var(--mdc-theme-on-surface);
    }
    
    mat-progress-bar {
      margin-top: 8px;
    }
    
    .locations-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 32px;
      row-gap: 32px;
      margin-bottom: 32px;
      align-items: start;
      grid-auto-rows: minmax(320px, auto);
      padding-bottom: 24px;
      container-type: inline-size;
    }
    
    @media (max-width: 768px) {
      .locations-grid {
        grid-template-columns: 1fr;
      }
    }
    
    .error-card,
    .empty-state {
      max-width: 600px;
      margin: 48px auto;
      text-align: center;
    }
    
    .error-card mat-card-content,
    .empty-state mat-card-content {
      padding: 48px 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }
    
    .error-card mat-icon,
    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: var(--mdc-theme-on-surface);
      opacity: 0.7;
    }
    
    .error-card mat-icon {
      color: #ef5350;
      opacity: 1;
    }
    
    .empty-state h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 400;
      color: var(--mdc-theme-on-surface);
    }
    
    .empty-state p {
      margin: 0;
      color: var(--mdc-theme-on-surface);
      opacity: 0.7;
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  private locationService = inject(LocationService);
  private destroy$ = new Subject<void>();
  
  locations = signal<WeatherLocation[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  flipStatesMap = new Map<string, WritableSignal<boolean>>();
  
  ngOnInit() {
    this.loadLocations();
    this.subscribeToLocationUpdates();
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadLocations() {
    this.loading.set(true);
    this.error.set(null);
    
    this.locationService.fetchLocations().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (locations) => {
        this.locations.set(locations.slice(0, 5));
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading locations:', err);
        this.error.set('Failed to load locations');
        this.loading.set(false);
      }
    });
  }
  
  private subscribeToLocationUpdates() {
    this.locationService.locations$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(locations => {
      this.locations.set(locations.slice(0, 5));
    });
    
    this.locationService.loading$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(loading => {
      this.loading.set(loading);
    });
    
    this.locationService.error$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(error => {
      this.error.set(error);
    });
  }
  
  getFlipState(locationId: string): WritableSignal<boolean> {
    if (!this.flipStatesMap.has(locationId)) {
      this.flipStatesMap.set(locationId, signal(false));
    }
    return this.flipStatesMap.get(locationId)!;
  }
  
  onCardFlipped(locationId: string, isFlipped: boolean) {
    const flipSignal = this.getFlipState(locationId);
    flipSignal.set(isFlipped);
  }
}