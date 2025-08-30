import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { signal, importProvidersFrom } from '@angular/core';
import { WeatherDetailsBottomSheetComponent } from './weather-details-bottom-sheet.component';
import { LocationService } from '../../../../core/services/location.service';
import { Weather } from '@shared/models/weather.model';
import { WeatherLocation } from '@shared/models/location.model';
import { MatDialogModule } from '@angular/material/dialog';
import { A11yModule } from '@angular/cdk/a11y';
import { PlatformModule } from '@angular/cdk/platform';
import { LayoutModule } from '@angular/cdk/layout';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('WeatherDetailsBottomSheetComponent', () => {
  let component: WeatherDetailsBottomSheetComponent;
  let fixture: ComponentFixture<WeatherDetailsBottomSheetComponent>;
  let mockBottomSheetRef: jest.Mocked<MatBottomSheetRef>;
  let mockLocationService: jest.Mocked<LocationService>;
  let mockSnackBar: jest.Mocked<MatSnackBar>;

  const mockWeather: Weather = {
    timestamp: new Date(),
    temperature: 72,
    feelsLike: 70,
    humidity: 65,
    pressure: 1013,
    windSpeed: 10,
    windDirection: 180,
    cloudiness: 0,
    visibility: 10000,
    description: 'Clear sky',
    icon: '01d'
  };

  const mockData = {
    weather: mockWeather,
    locationName: 'Seattle, WA',
    latitude: 47.6,
    longitude: -122.3
  };

  beforeEach(async () => {
    const bottomSheetRefSpy = {
      dismiss: jest.fn(),
    };
    const locationServiceSpy = {
      addLocation: jest.fn(),
      locations$: of([]),
    };
    const snackBarSpy = {
      open: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [WeatherDetailsBottomSheetComponent, NoopAnimationsModule],
      providers: [
        { provide: MatBottomSheetRef, useValue: bottomSheetRefSpy },
        { provide: MAT_BOTTOM_SHEET_DATA, useValue: mockData },
        { provide: LocationService, useValue: locationServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        importProvidersFrom(
          MatDialogModule,
          A11yModule,
          PlatformModule,
          LayoutModule
        ),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WeatherDetailsBottomSheetComponent);
    component = fixture.componentInstance;
    mockBottomSheetRef = TestBed.inject(MatBottomSheetRef) as jest.Mocked<MatBottomSheetRef>;
    mockLocationService = TestBed.inject(LocationService) as jest.Mocked<LocationService>;
    mockSnackBar = TestBed.inject(MatSnackBar) as jest.Mocked<MatSnackBar>;
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with provided data', () => {
    expect(component.weather()).toEqual(mockWeather);
    expect(component.locationName()).toBe('Seattle, WA');
    expect(component.latitude()).toBe(47.6);
    expect(component.longitude()).toBe(-122.3);
  });

  it('should calculate wind direction correctly', () => {
    // Test different wind degrees
    component.weather.set({ ...mockWeather, windDirection: 0 });
    expect(component.windDirection()).toBe('N');
    
    component.weather.set({ ...mockWeather, windDirection: 45 });
    expect(component.windDirection()).toBe('NE');
    
    component.weather.set({ ...mockWeather, windDirection: 90 });
    expect(component.windDirection()).toBe('E');
    
    component.weather.set({ ...mockWeather, windDirection: 180 });
    expect(component.windDirection()).toBe('S');
    
    component.weather.set({ ...mockWeather, windDirection: 270 });
    expect(component.windDirection()).toBe('W');
  });

  it('should select correct weather icon based on conditions', () => {
    component.weather.set({ ...mockWeather, description: 'Clear sky' });
    expect(component.weatherIcon()).toBe('wb_sunny');
    
    component.weather.set({ ...mockWeather, description: 'Cloudy' });
    expect(component.weatherIcon()).toBe('cloud');
    
    component.weather.set({ ...mockWeather, description: 'Light rain' });
    expect(component.weatherIcon()).toBe('umbrella');
    
    component.weather.set({ ...mockWeather, description: 'Snow' });
    expect(component.weatherIcon()).toBe('ac_unit');
    
    component.weather.set({ ...mockWeather, description: 'Thunderstorm' });
    expect(component.weatherIcon()).toBe('flash_on');
  });

  it('should allow adding location when under limit', () => {
    // Mock location service with 3 locations (under limit of 5)
    Object.defineProperty(mockLocationService, 'locations$', {
      value: of([{} as WeatherLocation, {} as WeatherLocation, {} as WeatherLocation])
    });
    
    fixture = TestBed.createComponent(WeatherDetailsBottomSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    expect(component.canAddLocation()).toBe(true);
  });

  it('should not allow adding location when at limit', () => {
    // Mock location service with 5 locations (at limit)
    const fiveLocations = Array(5).fill({} as WeatherLocation);
    Object.defineProperty(mockLocationService, 'locations$', {
      value: of(fiveLocations)
    });
    
    fixture = TestBed.createComponent(WeatherDetailsBottomSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    expect(component.canAddLocation()).toBe(false);
  });

  it('should add location to dashboard successfully', () => {
    mockLocationService.addLocation.mockReturnValue(of({} as WeatherLocation));
    
    component.addToDashboard();
    
    expect(mockLocationService.addLocation).toHaveBeenCalled();
    const addedLocation = mockLocationService.addLocation.mock.calls[0][0];
    expect(addedLocation.name).toBe('Seattle, WA');
    expect(addedLocation.latitude).toBe(47.6);
    expect(addedLocation.longitude).toBe(-122.3);
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Location added to dashboard',
      'OK',
      { duration: 3000 }
    );
    expect(mockBottomSheetRef.dismiss).toHaveBeenCalled();
  });

  it('should handle error when adding location fails', () => {
    mockLocationService.addLocation.mockReturnValue(
      throwError(() => new Error('Add failed'))
    );
    
    component.addToDashboard();
    
    expect(mockLocationService.addLocation).toHaveBeenCalled();
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Failed to add location',
      'OK',
      { duration: 3000 }
    );
    expect(component.isLoading()).toBe(false);
  });

  it('should show max locations message when at limit', () => {
    // Set up component with 5 locations
    const fiveLocations = Array(5).fill({} as WeatherLocation);
    Object.defineProperty(mockLocationService, 'locations$', {
      value: of(fiveLocations)
    });
    
    fixture = TestBed.createComponent(WeatherDetailsBottomSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    component.addToDashboard();
    
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Maximum of 5 locations reached',
      'OK',
      { duration: 3000 }
    );
    expect(mockLocationService.addLocation).not.toHaveBeenCalled();
  });

  it('should dismiss bottom sheet', () => {
    component.dismiss();
    expect(mockBottomSheetRef.dismiss).toHaveBeenCalled();
  });

  it('should share location using Web Share API if available', () => {
    const mockShare = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', {
      value: mockShare,
      configurable: true
    });
    
    component.shareLocation();
    
    expect(mockShare).toHaveBeenCalledWith({
      title: 'Weather at Seattle, WA',
      text: '72°F, Clear sky',
      url: 'https://maps.google.com/?q=47.6,-122.3'
    });
  });

  it('should copy location to clipboard if Web Share API not available', async () => {
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      configurable: true
    });
    
    const mockWriteText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      configurable: true
    });
    
    component.shareLocation();
    await fixture.whenStable();
    
    expect(mockWriteText).toHaveBeenCalledWith('https://maps.google.com/?q=47.6,-122.3');
  });
});
