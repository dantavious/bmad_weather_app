import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { WeatherCardComponent } from './weather-card.component';
import { WeatherService } from '../../../../core/services/weather.service';
import { SettingsService } from '../../../../core/services/settings.service';
import { WeatherLocation } from '@shared/models/location.model';
import { WeatherForecast } from '@shared/models/weather.model';

describe('WeatherCardComponent', () => {
  let component: WeatherCardComponent;
  let fixture: ComponentFixture<WeatherCardComponent>;
  let mockWeatherService: any;
  let mockSettingsService: any;

  const mockLocation: WeatherLocation = {
    id: '1',
    name: 'New York, NY',
    latitude: 40.7128,
    longitude: -74.0060,
    isPrimary: true,
    order: 0,
    createdAt: new Date(),
    settings: {
      alertsEnabled: true,
      units: 'imperial'
    }
  };

  const mockWeatherForecast: WeatherForecast = {
    location: {
      latitude: 40.7128,
      longitude: -74.0060,
      city: 'New York',
      country: 'US'
    },
    current: {
      timestamp: new Date(),
      temperature: 72,
      feelsLike: 75,
      humidity: 65,
      pressure: 1013,
      windSpeed: 10,
      windDirection: 180,
      cloudiness: 40,
      visibility: 10000,
      description: 'Partly cloudy',
      icon: '02d'
    }
  };

  beforeEach(async () => {
    mockWeatherService = {
      getCurrentWeatherByCoordinates: jest.fn().mockReturnValue(of(mockWeatherForecast)),
      getWeatherObservable: jest.fn().mockReturnValue(of(mockWeatherForecast)),
      getLoadingState: jest.fn().mockReturnValue(of(false)),
      getErrorState: jest.fn().mockReturnValue(of(null))
    };
    
    mockSettingsService = {
      getUnits: jest.fn().mockReturnValue('imperial')
    };

    await TestBed.configureTestingModule({
      imports: [WeatherCardComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: WeatherService, useValue: mockWeatherService },
        { provide: SettingsService, useValue: mockSettingsService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WeatherCardComponent);
    component = fixture.componentInstance;
    component.location = mockLocation;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load weather on init', () => {
    fixture.detectChanges();
    expect(mockWeatherService.getCurrentWeatherByCoordinates).toHaveBeenCalledWith(
      40.7128,
      -74.0060,
      'imperial'
    );
    expect(component.weather()).toEqual(mockWeatherForecast);
  });

  it('should display location name', () => {
    fixture.detectChanges();
    const element = fixture.nativeElement;
    expect(element.textContent).toContain('New York, NY');
  });

  it('should display temperature with correct unit', () => {
    fixture.detectChanges();
    expect(component.formatTemperature(72.5)).toBe('73');
    expect(component.getUnitSymbol()).toBe('F');
  });

  it('should display temperature in Celsius when metric', () => {
    mockSettingsService.getUnits.mockReturnValue('metric');
    fixture.detectChanges();
    expect(component.getUnitSymbol()).toBe('C');
    expect(component.getSpeedUnit()).toBe('km/h');
  });

  it('should show loading state', () => {
    component.loading.set(true);
    fixture.detectChanges();
    const element = fixture.nativeElement;
    expect(element.querySelector('app-loading-skeleton')).toBeTruthy();
  });

  it('should show error state', () => {
    component.error.set('Failed to load weather');
    fixture.detectChanges();
    const element = fixture.nativeElement;
    expect(element.textContent).toContain('Failed to load weather');
    expect(element.querySelector('button')).toBeTruthy();
  });

  it('should retry loading weather on error', () => {
    component.error.set('Failed to load weather');
    fixture.detectChanges();
    
    const retryButton = fixture.nativeElement.querySelector('button');
    retryButton.click();
    
    expect(mockWeatherService.getCurrentWeatherByCoordinates).toHaveBeenCalled();
  });

  it('should display primary badge for primary location', () => {
    component.weather.set(mockWeatherForecast);
    fixture.detectChanges();
    const element = fixture.nativeElement;
    expect(element.querySelector('.primary-badge')).toBeTruthy();
  });

  it('should not display primary badge for non-primary location', () => {
    component.location = { ...mockLocation, isPrimary: false };
    component.weather.set(mockWeatherForecast);
    fixture.detectChanges();
    const element = fixture.nativeElement;
    expect(element.querySelector('.primary-badge')).toBeFalsy();
  });

  it('should format wind speed correctly', () => {
    expect(component.formatWindSpeed(10.7)).toBe('11');
  });

  it('should map weather icons correctly', () => {
    expect(component.getWeatherIcon('01d')).toBe('wb_sunny');
    expect(component.getWeatherIcon('01n')).toBe('nightlight');
    expect(component.getWeatherIcon('10d')).toBe('umbrella');
    expect(component.getWeatherIcon('unknown')).toBe('cloud');
  });

  it('should handle weather service errors', () => {
    mockWeatherService.getCurrentWeatherByCoordinates.mockReturnValue(
      throwError(() => new Error('Network error'))
    );
    
    component.loadWeather();
    
    expect(component.error()).toBe('Failed to load weather data');
    expect(component.loading()).toBe(false);
  });
});