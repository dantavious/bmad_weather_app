import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SolarFormComponent } from './components/solar-form/solar-form.component';
import { SolarResultsComponent } from './components/solar-results/solar-results.component';
import { SolarService } from '../../core/services/solar.service';
import { LocationService } from '../../core/services/location.service';
import { SolarPanel, SolarCalculationResult } from '../../../../../shared/models/solar.model';

@Component({
  selector: 'app-solar-calculator',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    SolarFormComponent,
    SolarResultsComponent
  ],
  template: `
    <div class="solar-calculator-container">
      <mat-card class="solar-header-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>solar_power</mat-icon>
          <mat-card-title>Solar Calculator</mat-card-title>
          <mat-card-subtitle>Estimate your daily solar generation</mat-card-subtitle>
        </mat-card-header>
      </mat-card>

      <app-solar-form 
        (calculate)="onCalculate($event)"
        [savedLocations]="savedLocations()"
        [loading]="calculating()">
      </app-solar-form>

      @if (calculating()) {
        <mat-card class="loading-card">
          <mat-card-content>
            <mat-spinner diameter="40"></mat-spinner>
            <p>Calculating solar generation...</p>
          </mat-card-content>
        </mat-card>
      }

      @if (calculationResult() && !calculating()) {
        <app-solar-results 
          [result]="calculationResult()!">
        </app-solar-results>
      }

      @if (error()) {
        <mat-card class="error-card">
          <mat-card-content>
            <mat-icon color="warn">error</mat-icon>
            <p>{{ error() }}</p>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .solar-calculator-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 16px;
    }

    .solar-header-card {
      margin-bottom: 24px;
    }

    .loading-card {
      margin: 24px 0;
      text-align: center;
    }

    .loading-card mat-spinner {
      margin: 0 auto 16px;
    }

    .error-card {
      margin: 24px 0;
      background-color: rgba(244, 67, 54, 0.1);
    }

    .error-card mat-card-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .error-card mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    @media (max-width: 600px) {
      .solar-calculator-container {
        padding: 8px;
      }
    }
  `]
})
export class SolarCalculatorComponent {
  private solarService = inject(SolarService);
  private locationService = inject(LocationService);

  savedLocations = this.locationService.locations;
  calculating = signal(false);
  calculationResult = signal<SolarCalculationResult | null>(null);
  error = signal<string | null>(null);

  async onCalculate(data: { panel: SolarPanel; locationId: string }) {
    this.calculating.set(true);
    this.error.set(null);
    this.calculationResult.set(null);

    try {
      const location = this.savedLocations().find(l => l.id === data.locationId);
      if (!location) {
        throw new Error('Selected location not found');
      }

      const result = await this.solarService.calculateDailyGeneration(
        data.panel,
        location.latitude,
        location.longitude
      );

      this.calculationResult.set(result);
    } catch (err) {
      console.error('Solar calculation error:', err);
      this.error.set(err instanceof Error ? err.message : 'Failed to calculate solar generation');
    } finally {
      this.calculating.set(false);
    }
  }
}