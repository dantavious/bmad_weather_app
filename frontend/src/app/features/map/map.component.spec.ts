import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MapComponent } from './map.component';
import { GoogleMapsService } from '../../core/services/google-maps.service';
import { WeatherService } from '../../core/services/weather.service';
import { LocationService } from '../../core/services/location.service';
import { WeatherLayerService } from '../../core/services/weather-layer.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { OverlayModule } from '@angular/cdk/overlay';
import { Component, importProvidersFrom } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { A11yModule } from '@angular/cdk/a11y';
import { PlatformModule } from '@angular/cdk/platform';
import { LayoutModule } from '@angular/cdk/layout';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClient } from '@angular/common/http';

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
      fromPointToLatLng: (point: any) => ({ lat: () => 40.7128, lng: () => -74.006 }),
    }),
    setOptions: jest.fn(),
  }),
  reverseGeocode: jest.fn().mockReturnValue(of('New York, NY')),
};

const mockWeatherService = {
  getCurrentWeatherByCoordinates: jest.fn().mockReturnValue(of({ 
    current: { 
      temp: 72,
      humidity: 65,
      weather: [{ description: 'Clear sky' }],
      wind_speed: 10,
      wind_deg: 180
    } 
  })),
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
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    
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

    httpTestingController = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(MapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Map Click Handling', () => {
    it('should fetch weather on map click', fakeAsync(() => {
      const lat = 40.7128;
      const lng = -74.006;
      
      component['handleMapClick'](lat, lng);
      
      // Mock the reverse geocoding HTTP request
      const req = httpTestingController.expectOne(req => req.url.includes('/geocode/reverse'));
      req.flush({ locationName: 'New York, NY' });
      
      tick();

      expect(mockWeatherService.getCurrentWeatherByCoordinates).toHaveBeenCalledWith(40.71, -74.01);
      expect(mockBottomSheet.open).toHaveBeenCalled();
    }));

    it('should handle weather fetch error gracefully', fakeAsync(() => {
      mockWeatherService.getCurrentWeatherByCoordinates.mockReturnValueOnce(throwError(() => new Error('API Error')));
      const lat = 40.7128;
      const lng = -74.006;
      
      component['handleMapClick'](lat, lng);
      
      // Mock the reverse geocoding HTTP request (even though it won't be reached due to the weather error)
      httpTestingController.expectNone(req => req.url.includes('/geocode/reverse'));
      
      tick();

      expect(mockSnackBar.open).toHaveBeenCalledWith('Unable to fetch weather data', 'Dismiss', expect.any(Object));
    }));
    
    it('should setup map click handlers when map is initialized', () => {
      const mockMap = {
        addListener: jest.fn(),
        getBounds: jest.fn(),
        getProjection: jest.fn(),
        setOptions: jest.fn(),
      };
      component['googleMap'] = mockMap as any;
      component['setupMapClickHandlers']();
      
      expect(mockMap.addListener).toHaveBeenCalledWith('click', expect.any(Function));
      expect(mockMap.addListener).toHaveBeenCalledWith('rightclick', expect.any(Function));
    });
    
    it('should handle map click event with coordinates', fakeAsync(() => {
      const mockMap = {
        addListener: jest.fn((event, callback) => {
          if (event === 'click') {
            // Simulate immediate click
            callback({
              latLng: {
                lat: () => 40.7128,
                lng: () => -74.006
              }
            });
          }
        }),
        getBounds: jest.fn(),
        getProjection: jest.fn(),
        setOptions: jest.fn(),
      };
      
      component['googleMap'] = mockMap as any;
      const handleMapClickSpy = jest.spyOn(component as any, 'handleMapClick');
      
      component['setupMapClickHandlers']();
      tick();
      
      expect(handleMapClickSpy).toHaveBeenCalledWith(40.7128, -74.006);
    }));
    
    it('should handle right-click for context menu', fakeAsync(() => {
      const mockMap = {
        addListener: jest.fn((event, callback) => {
          if (event === 'rightclick') {
            callback({
              latLng: {
                lat: () => 40.7128,
                lng: () => -74.006
              },
              domEvent: { clientX: 100, clientY: 200 }
            });
          }
        }),
        getBounds: jest.fn(),
        getProjection: jest.fn(),
        setOptions: jest.fn(),
      };
      
      component['googleMap'] = mockMap as any;
      const showContextMenuSpy = jest.spyOn(component as any, 'showContextMenu');
      
      component['setupMapClickHandlers']();
      tick();
      
      expect(showContextMenuSpy).toHaveBeenCalledWith(40.7128, -74.006, expect.objectContaining({
        latLng: expect.any(Object),
        domEvent: expect.objectContaining({ clientX: 100, clientY: 200 })
      }));
    }));
    
    it('should round coordinates to 2 decimal places', fakeAsync(() => {
      const lat = 40.71289;
      const lng = -74.00678;
      component['handleMapClick'](lat, lng);
      tick();
      
      expect(mockWeatherService.getCurrentWeatherByCoordinates).toHaveBeenCalledWith(40.71, -74.01);
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
    
    it('should remove oldest location when limit is exceeded', () => {
      // Add 10 locations
      for (let i = 0; i < 10; i++) {
        component['addRecentLocation'](40 + i, -74 - i, { temp: 72 } as any, `Location ${i}`);
      }
      
      // Verify first location exists
      expect(component.recentLocations().has('40.00_-74.00')).toBe(true);
      
      // Add 11th location
      component['addRecentLocation'](50, -84, { temp: 72 } as any, 'Location 11');
      
      // Verify first location was removed and new one added
      expect(component.recentLocations().has('40.00_-74.00')).toBe(false);
      expect(component.recentLocations().has('50.00_-84.00')).toBe(true);
      expect(component.recentLocations().size).toBe(10);
    });
    
    it('should create unique cache keys for different coordinates', () => {
      component['addRecentLocation'](40.71, -74.01, { temp: 72 } as any, 'Location 1');
      component['addRecentLocation'](40.72, -74.01, { temp: 73 } as any, 'Location 2');
      component['addRecentLocation'](40.71, -74.02, { temp: 74 } as any, 'Location 3');
      
      const recentLocations = component.recentLocations();
      expect(recentLocations.size).toBe(3);
      expect(recentLocations.has('40.71_-74.01')).toBe(true);
      expect(recentLocations.has('40.72_-74.01')).toBe(true);
      expect(recentLocations.has('40.71_-74.02')).toBe(true);
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
    
    it('should cancel long-press on touch move', fakeAsync(() => {
      const mapDiv = fixture.nativeElement.querySelector('.map-container');
      const showContextMenuSpy = jest.spyOn(component as any, 'showContextMenu');
      
      // Simulate touch start
      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [new Touch({ clientX: 100, clientY: 150, identifier: 1, target: mapDiv })],
      });
      mapDiv.dispatchEvent(touchStartEvent);
      
      // Simulate touch move before long-press completes
      tick(200);
      const touchMoveEvent = new TouchEvent('touchmove');
      mapDiv.dispatchEvent(touchMoveEvent);
      
      // Complete the timer
      tick(300);
      
      // Context menu should not have been shown
      expect(showContextMenuSpy).not.toHaveBeenCalled();
    }));
    
    it('should handle context menu action selection', () => {
      const handleContextMenuActionSpy = jest.spyOn(component as any, 'handleContextMenuAction');
      const handleMapClickSpy = jest.spyOn(component as any, 'handleMapClick');
      
      // Test 'view-weather' action
      component['handleContextMenuAction']('view-weather', 40.71, -74.01);
      expect(handleMapClickSpy).toHaveBeenCalledWith(40.71, -74.01);
      
      // Test 'add-location' action
      const addLocationSpy = jest.spyOn(component as any, 'addLocationToDashboard');
      component['handleContextMenuAction']('add-location', 40.71, -74.01);
      expect(addLocationSpy).toHaveBeenCalledWith(40.71, -74.01);
      
      // Test 'share' action
      const shareLocationSpy = jest.spyOn(component as any, 'shareLocation');
      component['handleContextMenuAction']('share', 40.71, -74.01);
      expect(shareLocationSpy).toHaveBeenCalledWith(40.71, -74.01);
    });
  });
});
