import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { WeatherService } from './weather.service';
import { WeatherForecast } from '@shared/models/weather.model';
import { environment } from '../../../environments/environment';

describe('WeatherService', () => {
  let service: WeatherService;
  let httpMock: HttpTestingController;

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

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        WeatherService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(WeatherService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getCurrentWeatherByCoordinates', () => {
    it('should fetch weather data for coordinates', (done) => {
      service.getCurrentWeatherByCoordinates(40.7128, -74.0060, 'imperial').subscribe(data => {
        expect(data).toEqual(mockWeatherForecast);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/weather/current`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        latitude: 40.7128,
        longitude: -74.0060,
        units: 'imperial'
      });
      req.flush(mockWeatherForecast);
    });

    it('should cache weather data by coordinates', (done) => {
      service.getCurrentWeatherByCoordinates(40.7128, -74.0060).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/weather/current`);
      req.flush(mockWeatherForecast);

      service.getWeatherObservable(40.7128, -74.0060).subscribe(data => {
        expect(data).toEqual(mockWeatherForecast);
        done();
      });
    });

    it('should handle errors gracefully', (done) => {
      service.getCurrentWeatherByCoordinates(40.7128, -74.0060).subscribe(data => {
        expect(data).toEqual({} as WeatherForecast);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/weather/current`);
      req.flush('Error', { status: 500, statusText: 'Server Error' });

      service.getErrorState(40.7128, -74.0060).subscribe(error => {
        expect(error).toBe('Failed to load weather data');
      });
    });

    it('should round coordinates for caching', (done) => {
      service.getCurrentWeatherByCoordinates(40.7128456, -74.0060789).subscribe();
      
      const req = httpMock.expectOne(`${environment.apiUrl}/weather/current`);
      req.flush(mockWeatherForecast);

      service.getWeatherObservable(40.71, -74.01).subscribe(data => {
        expect(data).toEqual(mockWeatherForecast);
        done();
      });
    });
  });

  describe('getLoadingState', () => {
    it('should track loading state correctly', (done) => {
      const loadingStates: boolean[] = [];
      
      service.getLoadingState(40.71, -74.01).subscribe(loading => {
        loadingStates.push(loading);
        if (loadingStates.length === 3) {
          expect(loadingStates).toEqual([false, true, false]);
          done();
        }
      });

      service.getCurrentWeatherByCoordinates(40.7128, -74.0060).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/weather/current`);
      req.flush(mockWeatherForecast);
    });
  });

  describe('metric units', () => {
    it('should request metric units when specified', (done) => {
      service.getCurrentWeatherByCoordinates(40.7128, -74.0060, 'metric').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/weather/current`);
      expect(req.request.body.units).toBe('metric');
      req.flush(mockWeatherForecast);
      done();
    });
  });
});