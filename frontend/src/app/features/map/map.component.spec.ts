import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MapComponent } from './map.component';
import { GoogleMapsService } from '../../core/services/google-maps.service';
import { WeatherService } from '../../core/services/weather.service';
import { LocationService } from '../../core/services/location.service';
import { WeatherLayerService } from '../../core/services/weather-layer.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { OverlayModule } from '@angular/cdk/overlay';
import { Component, importProvidersFrom } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { A11yModule } from '@angular/cdk/a11y';
import { PlatformModule } from '@angular/cdk/platform';
import { LayoutModule } from '@angular/cdk/layout';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

// Mock child components
@Component({
  selector: 'app-weather-legend',
  template: '',
  standalone: true,
})
class MockWeatherLegendComponent {}

@Component({
    selector: 'app-layer-control',
    template: '',
    standalone: true,
})
class MockLayerControlComponent {}

// Mock services
const mockGoogleMapsService = {
  loadGoogleMaps: jest.fn().mockReturnValue(of(null)),
  getUserLocation: jest.fn().mockReturnValue(of({ coords: { latitude: 40.7128, longitude: -74.0060 } })),
  createMap: jest.fn().mockReturnValue({
    addListener: jest.fn(),
    getBounds: () => ({
      getNorthEast: () => ({ lat: () => 41, lng: () => -73 }),
      getSouthWest: () => ({ lat: () => 40, lng: () => -75 }),
    }),
    getProjection: () => ({
      fromLatLngToPoint: (latLng: any) => ({ x: 100, y: 100 }),
    }),
    setOptions: jest.fn(),
  }),
};

const mockWeatherService = {
  getCurrentWeatherByCoordinates: jest.fn().mockReturnValue(of({ current: { temp: 72 } })),
};

const mockLocationService = {
  locations: jest.fn().mockReturnValue([]),
  addLocation: jest.fn(),
};

import { signal } from '@angular/core';
// ... other imports

const mockWeatherLayerService = {
  restoreFromSession: jest.fn(),
  saveToSession: jest.fn(),
  layers: jest.fn().mockReturnValue([]),
  activeLayers: signal([]),
};

const mockSnackBar = {
  open: jest.fn(),
};

const mockBottomSheet = {
  open: jest.fn().mockReturnValue({ afterDismissed: () => of(null) }),
};

describe('MapComponent', () => {
  let component: MapComponent;
  let fixture: ComponentFixture<MapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapComponent, HttpClientTestingModule, OverlayModule, MockWeatherLegendComponent, MockLayerControlComponent, NoopAnimationsModule],
      providers: [
        { provide: GoogleMapsService, useValue: mockGoogleMapsService },
        { provide: WeatherService, useValue: mockWeatherService },
        { provide: LocationService, useValue: mockLocationService },
        { provide: WeatherLayerService, useValue: mockWeatherLayerService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: MatBottomSheet, useValue: mockBottomSheet },
        importProvidersFrom(
          MatDialogModule,
          A11yModule,
          PlatformModule,
          LayoutModule
        ),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Map Click Handling', () => {
    it('should fetch weather on map click', fakeAsync(() => {
      const lat = 40.7128;
      const lng = -74.006;
      component['handleMapClick'](lat, lng);
      tick();

      expect(mockWeatherService.getCurrentWeatherByCoordinates).toHaveBeenCalledWith(40.71, -74.01);
      expect(mockBottomSheet.open).toHaveBeenCalled();
    }));

    it('should handle weather fetch error gracefully', fakeAsync(() => {
      mockWeatherService.getCurrentWeatherByCoordinates.mockReturnValueOnce(throwError(() => new Error('API Error')));
      const lat = 40.7128;
      const lng = -74.006;
      component['handleMapClick'](lat, lng);
      tick();

      expect(mockSnackBar.open).toHaveBeenCalledWith('Unable to fetch weather data', 'Dismiss', expect.any(Object));
    }));
  });

  describe('Recent Locations Cache', () => {
    it('should add a location to the recent locations cache', () => {
      component['addRecentLocation'](40.71, -74.01, { temp: 72 } as any, 'New York');
      const recentLocations = component.recentLocations();
      expect(recentLocations.size).toBe(1);
      expect(recentLocations.has('40.71_-74.01')).toBe(true);
    });

    it('should enforce the 10-location limit', () => {
      for (let i = 0; i < 11; i++) {
        component['addRecentLocation'](40 + i, -74 - i, { temp: 72 } as any, `Location ${i}`);
      }
      const recentLocations = component.recentLocations();
      expect(recentLocations.size).toBe(10);
    });
  });

  describe('Mobile Long-Press and Context Menu', () => {
    it('should open context menu on long-press', fakeAsync(() => {
        const mapDiv = fixture.nativeElement.querySelector('.map-container');
        const showContextMenuSpy = jest.spyOn(component as any, 'showContextMenu');

        // Simulate touch start
        const touchStartEvent = new TouchEvent('touchstart', {
            touches: [new Touch({ clientX: 100, clientY: 150, identifier: 1, target: mapDiv })],
        });
        mapDiv.dispatchEvent(touchStartEvent);

        // Advance time to trigger long-press
        tick(500);

        expect(showContextMenuSpy).toHaveBeenCalled();
    }));
  });
});
