import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal, importProvidersFrom } from '@angular/core';
import { of, throwError } from 'rxjs';
import { WeatherCardComponent } from './weather-card.component';
import { WeatherService } from '../../../../core/services/weather.service';
import { SettingsService } from '../../../../core/services/settings.service';
import { WeatherLocation } from '@shared/models/location.model';
import { WeatherForecast, DailyWeather } from '@shared/models/weather.model';
import { MatDialogModule } from '@angular/material/dialog';
import { A11yModule } from '@angular/cdk/a11y';
import { PlatformModule } from '@angular/cdk/platform';
import { LayoutModule } from '@angular/cdk/layout';

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
    },
    hourly: [],
    daily: []
  };

  const mockDailyForecast: DailyWeather[] = [
    {
      date: new Date(),
      temperatureMin: 60,
      temperatureMax: 75,
      humidity: 60,
      windSpeed: 8,
      description: 'Clear',
      icon: '01d',
      precipitationProbability: 10
    },
    {
      date: new Date(Date.now() + 86400000),
      temperatureMin: 55,
      temperatureMax: 70,
      humidity: 70,
      windSpeed: 12,
      description: 'Cloudy',
      icon: '03d',
      precipitationProbability: 30
    }
  ];

  beforeEach(async () => {
    mockWeatherService = {
      getCurrentWeatherByCoordinates: jest.fn().mockReturnValue(of(mockWeatherForecast)),
      getWeatherObservable: jest.fn().mockReturnValue(of(mockWeatherForecast)),
      getLoadingState: jest.fn().mockReturnValue(of(false)),
      getErrorState: jest.fn().mockReturnValue(of(null)),
      getForecast: jest.fn().mockReturnValue(of(mockDailyForecast))
    };
    
    mockSettingsService = {
      getUnits: jest.fn().mockReturnValue('imperial')
    };

    await TestBed.configureTestingModule({
      imports: [WeatherCardComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: WeatherService, useValue: mockWeatherService },
        { provide: SettingsService, useValue: mockSettingsService },
        importProvidersFrom(
          MatDialogModule,
          A11yModule,
          PlatformModule,
          LayoutModule
        ),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WeatherCardComponent);
    component = fixture.componentInstance;
    component.location = mockLocation;
    component.isFlipped = signal(false);
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

  // New tests for flip and forecast functionality
  it('should flip card when clicked', () => {
    const emitSpy = jest.spyOn(component.flipped, 'emit');
    fixture.detectChanges();
    
    expect(component.isFlipped()).toBe(false);
    
    component.toggleFlip();
    
    expect(component.isFlipped()).toBe(true);
    expect(emitSpy).toHaveBeenCalledWith(true);
  });

  it('should load forecast when flipped to back', () => {
    fixture.detectChanges();
    
    component.toggleFlip();
    
    expect(mockWeatherService.getForecast).toHaveBeenCalledWith(
      40.7128,
      -74.0060,
      'imperial'
    );
    expect(component.forecast()).toEqual(mockDailyForecast);
  });

  it('should not reload forecast if already loaded', () => {
    component.forecast.set(mockDailyForecast);
    mockWeatherService.getForecast.mockClear();
    
    component.loadForecast();
    
    expect(mockWeatherService.getForecast).not.toHaveBeenCalled();
  });

  it('should display forecast data on back', () => {
    component.forecast.set(mockDailyForecast);
    component.isFlipped.set(true);
    fixture.detectChanges();
    
    const element = fixture.nativeElement;
    expect(element.textContent).toContain('7-Day Forecast');
    expect(element.textContent).toContain('60°');
    expect(element.textContent).toContain('75°');
  });

  it('should format day names correctly', () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 3);
    
    expect(component.getDayName(today)).toBe('Today');
    expect(component.getDayName(tomorrow)).toBe('Tomorrow');
    expect(component.getDayName(dayAfter)).toMatch(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/);
  });

  it('should detect horizontal swipe gestures', () => {
    const toggleFlipSpy = jest.spyOn(component, 'toggleFlip');
    
    // Save original Date.now
    const originalNow = Date.now;
    let mockTime = 1000;
    Date.now = jest.fn(() => mockTime);
    
    const touchStartEvent = new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100 } as any]
    });
    
    component.onTouchStart(touchStartEvent);
    
    // Simulate quick swipe (100ms)
    mockTime += 100;
    
    const touchEndEvent = new TouchEvent('touchend', {
      changedTouches: [{ clientX: 200, clientY: 105 } as any]
    });
    
    component.onTouchEnd(touchEndEvent);
    
    expect(toggleFlipSpy).toHaveBeenCalled();
    
    // Restore original Date.now
    Date.now = originalNow;
  });

  it('should not flip on vertical swipe', () => {
    const toggleFlipSpy = jest.spyOn(component, 'toggleFlip');
    
    const touchStartEvent = new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100 } as any]
    });
    
    const touchEndEvent = new TouchEvent('touchend', {
      changedTouches: [{ clientX: 105, clientY: 250 } as any]
    });
    
    component.onTouchStart(touchStartEvent);
    component.onTouchEnd(touchEndEvent);
    
    expect(toggleFlipSpy).not.toHaveBeenCalled();
  });

  it('should not flip on slow swipe', () => {
    const toggleFlipSpy = jest.spyOn(component, 'toggleFlip');
    
    // Save original Date.now
    const originalNow = Date.now;
    let mockTime = 1000;
    Date.now = jest.fn(() => mockTime);
    
    const touchStartEvent = new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100 } as any]
    });
    
    component.onTouchStart(touchStartEvent);
    
    // Simulate slow swipe (500ms - too slow)
    mockTime += 500;
    
    const touchEndEvent = new TouchEvent('touchend', {
      changedTouches: [{ clientX: 200, clientY: 100 } as any]
    });
    
    component.onTouchEnd(touchEndEvent);
    
    expect(toggleFlipSpy).not.toHaveBeenCalled();
    
    // Restore original Date.now
    Date.now = originalNow;
  });

  it('should handle forecast loading error', () => {
    mockWeatherService.getForecast.mockReturnValue(
      throwError(() => new Error('API Error'))
    );
    
    component.loadForecast();
    
    expect(component.forecastError()).toBe('Failed to load forecast');
    expect(component.loadingForecast()).toBe(false);
  });

  it('should handle retry forecast on error', () => {
    const loadForecastSpy = jest.spyOn(component, 'loadForecast');
    const event = new Event('click');
    
    component.handleRetryForecast(event);
    
    expect(loadForecastSpy).toHaveBeenCalled();
  });

  it('should display precipitation probability when > 0', () => {
    component.forecast.set(mockDailyForecast);
    component.isFlipped.set(true);
    fixture.detectChanges();
    
    const element = fixture.nativeElement;
    const precipElements = element.querySelectorAll('.precipitation');
    
    // Both days have precipitation > 0
    expect(precipElements.length).toBe(2);
    expect(precipElements[0].textContent).toContain('10%');
    expect(precipElements[1].textContent).toContain('30%');
  });

  it('should show flip indicator icons', () => {
    component.weather.set(mockWeatherForecast);
    fixture.detectChanges();
    
    let element = fixture.nativeElement;
    expect(element.querySelector('.flip-indicator').textContent).toContain('flip_to_back');
    
    component.isFlipped.set(true);
    component.forecast.set(mockDailyForecast);
    fixture.detectChanges();
    
    element = fixture.nativeElement;
    expect(element.querySelector('.flip-indicator').textContent).toContain('flip_to_front');
  });
});
