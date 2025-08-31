import { Component, EventEmitter, Input, Output, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WeatherLocation } from '../../../../../../../shared/models/location.model';
import { SolarPanel } from '../../../../../../../shared/models/solar.model';

@Component({
  selector: 'app-solar-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <mat-card class="solar-form-card">
      <mat-card-header>
        <mat-card-title>Solar Panel Configuration</mat-card-title>
        <mat-card-subtitle>Enter your solar panel specifications</mat-card-subtitle>
      </mat-card-header>
      
      <mat-card-content>
        <form [formGroup]="solarForm" (ngSubmit)="onSubmit()">
          <div class="form-row">
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Panel Wattage</mat-label>
              <input 
                matInput 
                type="number" 
                formControlName="wattage"
                placeholder="e.g., 400"
                min="50"
                max="1000">
              <span matTextSuffix>W</span>
              <mat-hint>Individual panel rated wattage (50-1000W)</mat-hint>
              @if (solarForm.get('wattage')?.invalid && solarForm.get('wattage')?.touched) {
                <mat-error>
                  @if (solarForm.get('wattage')?.errors?.['required']) {
                    Panel wattage is required
                  }
                  @if (solarForm.get('wattage')?.errors?.['min']) {
                    Minimum wattage is 50W
                  }
                  @if (solarForm.get('wattage')?.errors?.['max']) {
                    Maximum wattage is 1000W
                  }
                </mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Number of Panels</mat-label>
              <input 
                matInput 
                type="number" 
                formControlName="quantity"
                placeholder="e.g., 10"
                min="1"
                max="1000">
              <mat-hint>Total number of panels (1-1000)</mat-hint>
              @if (solarForm.get('quantity')?.invalid && solarForm.get('quantity')?.touched) {
                <mat-error>
                  @if (solarForm.get('quantity')?.errors?.['required']) {
                    Number of panels is required
                  }
                  @if (solarForm.get('quantity')?.errors?.['min']) {
                    Minimum is 1 panel
                  }
                  @if (solarForm.get('quantity')?.errors?.['max']) {
                    Maximum is 1000 panels
                  }
                </mat-error>
              }
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>System Efficiency</mat-label>
              <input 
                matInput 
                type="number" 
                formControlName="efficiency"
                placeholder="e.g., 85"
                min="0"
                max="100">
              <span matTextSuffix>%</span>
              <mat-hint>Overall system efficiency including inverter losses (0-100%)</mat-hint>
              @if (solarForm.get('efficiency')?.invalid && solarForm.get('efficiency')?.touched) {
                <mat-error>
                  @if (solarForm.get('efficiency')?.errors?.['required']) {
                    Efficiency is required
                  }
                  @if (solarForm.get('efficiency')?.errors?.['min']) {
                    Efficiency must be at least 0%
                  }
                  @if (solarForm.get('efficiency')?.errors?.['max']) {
                    Efficiency cannot exceed 100%
                  }
                </mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Location</mat-label>
              <mat-select formControlName="locationId">
                @if (savedLocations.length === 0) {
                  <mat-option disabled>
                    No saved locations. Please add a location first.
                  </mat-option>
                } @else {
                  @for (location of savedLocations; track location.id) {
                    <mat-option [value]="location.id">
                      <mat-icon class="location-icon">
                        {{ location.isPrimary ? 'home' : 'location_on' }}
                      </mat-icon>
                      {{ location.name }}
                    </mat-option>
                  }
                }
              </mat-select>
              <mat-hint>Select location for solar calculations</mat-hint>
              @if (solarForm.get('locationId')?.invalid && solarForm.get('locationId')?.touched) {
                <mat-error>Please select a location</mat-error>
              }
            </mat-form-field>
          </div>

          <div class="system-summary">
            @if (systemCapacity() > 0) {
              <div class="summary-item">
                <mat-icon>solar_power</mat-icon>
                <span>Total System Capacity: {{ systemCapacity() }} kW</span>
              </div>
            }
          </div>
        </form>
      </mat-card-content>

      <mat-card-actions align="end">
        <button 
          mat-raised-button 
          color="primary" 
          type="submit"
          (click)="onSubmit()"
          [disabled]="solarForm.invalid || loading">
          <mat-icon>calculate</mat-icon>
          Calculate Generation
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .solar-form-card {
      margin-bottom: 24px;
    }

    .form-row {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .form-field {
      flex: 1;
      min-width: 250px;
    }

    .location-icon {
      margin-right: 8px;
      vertical-align: middle;
    }

    .system-summary {
      margin-top: 24px;
      padding: 16px;
      background-color: var(--mat-app-surface-container-high);
      border-radius: 8px;
    }

    .summary-item {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 16px;
      font-weight: 500;
    }

    mat-card-actions {
      padding: 16px;
    }

    @media (max-width: 600px) {
      .form-row {
        flex-direction: column;
      }

      .form-field {
        width: 100%;
      }
    }
  `]
})
export class SolarFormComponent {
  @Input() savedLocations: WeatherLocation[] = [];
  @Input() loading = false;
  @Output() calculate = new EventEmitter<{ panel: SolarPanel; locationId: string }>();

  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  solarForm = this.fb.group({
    wattage: [400, [Validators.required, Validators.min(50), Validators.max(1000)]],
    quantity: [10, [Validators.required, Validators.min(1), Validators.max(1000)]],
    efficiency: [85, [Validators.required, Validators.min(0), Validators.max(100)]],
    locationId: ['', Validators.required]
  });

  systemCapacity = signal(0);

  constructor() {
    this.solarForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(values => {
        if (values.wattage && values.quantity) {
          const capacity = (values.wattage * values.quantity) / 1000;
          this.systemCapacity.set(Math.round(capacity * 10) / 10);
        }
      });
  }

  onSubmit() {
    if (this.solarForm.valid && !this.loading) {
      const values = this.solarForm.value;
      this.calculate.emit({
        panel: {
          wattage: values.wattage!,
          quantity: values.quantity!,
          efficiency: values.efficiency!
        },
        locationId: values.locationId!
      });
    }
  }
}