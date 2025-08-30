import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { LocationService } from '../../../../core/services/location.service';
import { Weather } from '@shared/models/weather.model';
import { WeatherLocation } from '@shared/models/location.model';
import { toSignal } from '@angular/core/rxjs-interop';

interface BottomSheetData {
  weather: Weather;
  locationName: string;
  latitude: number;
  longitude: number;
}

@Component({
  selector: 'app-weather-details-bottom-sheet',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatSnackBarModule
  ],
  templateUrl: './weather-details-bottom-sheet.component.html',
  styleUrls: ['./weather-details-bottom-sheet.component.scss']
})
export class WeatherDetailsBottomSheetComponent {
  private bottomSheetRef = inject(MatBottomSheetRef<WeatherDetailsBottomSheetComponent>);
  private locationService = inject(LocationService);
  private snackBar = inject(MatSnackBar);
  data = inject<BottomSheetData>(MAT_BOTTOM_SHEET_DATA);
  
  // Signals for state management
  weather = signal(this.data.weather);
  locationName = signal(this.data.locationName);
  latitude = signal(this.data.latitude);
  longitude = signal(this.data.longitude);
  isLoading = signal(false);
  
  // Convert locations observable to signal
  private locations = toSignal(this.locationService.locations$, { initialValue: [] });
  
  // Computed values
  canAddLocation = computed(() => {
    return this.locations().length < 5;
  });
  
  windDirection = computed(() => {
    const deg = this.weather()?.windDirection || 0;
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(deg / 45) % 8;
    return directions[index];
  });
  
  weatherIcon = computed(() => {
    const description = this.weather()?.description?.toLowerCase() || '';
    if (description.includes('clear')) return 'wb_sunny';
    if (description.includes('cloud')) return 'cloud';
    if (description.includes('rain')) return 'umbrella';
    if (description.includes('snow')) return 'ac_unit';
    if (description.includes('thunder')) return 'flash_on';
    return 'filter_drama';
  });
  
  addToDashboard(): void {
    if (!this.canAddLocation()) {
      this.snackBar.open('Maximum of 5 locations reached', 'OK', {
        duration: 3000
      });
      return;
    }
    
    this.isLoading.set(true);
    
    const newLocation: WeatherLocation = {
      id: `loc_${Date.now()}`,
      name: this.locationName(),
      latitude: this.latitude(),
      longitude: this.longitude(),
      isPrimary: false,
      order: this.locations().length,
      createdAt: new Date(),
      settings: {
        alertsEnabled: false,
        units: 'imperial'
      }
    };
    
    this.locationService.addLocation(newLocation).subscribe({
      next: () => {
        this.snackBar.open('Location added to dashboard', 'OK', {
          duration: 3000
        });
        this.bottomSheetRef.dismiss();
      },
      error: (error) => {
        console.error('Error adding location:', error);
        this.snackBar.open('Failed to add location', 'OK', {
          duration: 3000
        });
        this.isLoading.set(false);
      }
    });
  }
  
  dismiss(): void {
    this.bottomSheetRef.dismiss();
  }
  
  shareLocation(): void {
    const url = `https://maps.google.com/?q=${this.latitude()},${this.longitude()}`;
    
    if (navigator.share) {
      navigator.share({
        title: `Weather at ${this.locationName()}`,
        text: `${this.weather()?.temperature}°F, ${this.weather()?.description}`,
        url: url
      }).catch(err => console.log('Error sharing:', err));
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(url).then(() => {
        this.snackBar.open('Location link copied to clipboard', 'OK', {
          duration: 3000
        });
      });
    }
  }
}