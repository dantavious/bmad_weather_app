import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Weather, WeatherForecast, DailyWeather } from '@shared/models/weather.model';

@Injectable({ providedIn: 'root' })
export class WeatherService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;
  
  private weatherCache = new Map<string, BehaviorSubject<WeatherForecast | null>>();
  private loadingStates = new Map<string, BehaviorSubject<boolean>>();
  private errorStates = new Map<string, BehaviorSubject<string | null>>();
  private forecastCache = new Map<string, BehaviorSubject<DailyWeather[]>>();

  getCurrentWeatherByCoordinates(lat: number, lon: number, units: 'imperial' | 'metric' = 'imperial'): Observable<WeatherForecast> {
    const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    
    if (!this.weatherCache.has(key)) {
      this.weatherCache.set(key, new BehaviorSubject<WeatherForecast | null>(null));
      this.loadingStates.set(key, new BehaviorSubject<boolean>(false));
      this.errorStates.set(key, new BehaviorSubject<string | null>(null));
    }
    
    const loading = this.loadingStates.get(key)!;
    const error = this.errorStates.get(key)!;
    const cache = this.weatherCache.get(key)!;
    
    loading.next(true);
    error.next(null);
    
    return this.http.post<Weather>(`${this.apiUrl}/weather/current`, {
      latitude: lat,
      longitude: lon,
      units
    }).pipe(
      map(weatherData => {
        // Transform the API response into the expected WeatherForecast format
        const forecast: WeatherForecast = {
          location: {
            latitude: lat,
            longitude: lon
          },
          current: weatherData
        };
        return forecast;
      }),
      tap(data => {
        cache.next(data);
        loading.next(false);
      }),
      catchError(err => {
        console.error('Error fetching weather:', err);
        error.next('Failed to load weather data');
        loading.next(false);
        return of({} as WeatherForecast);
      })
    );
  }
  
  getWeatherObservable(lat: number, lon: number): Observable<WeatherForecast | null> {
    const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    if (!this.weatherCache.has(key)) {
      this.weatherCache.set(key, new BehaviorSubject<WeatherForecast | null>(null));
    }
    return this.weatherCache.get(key)!.asObservable();
  }
  
  getLoadingState(lat: number, lon: number): Observable<boolean> {
    const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    if (!this.loadingStates.has(key)) {
      this.loadingStates.set(key, new BehaviorSubject<boolean>(false));
    }
    return this.loadingStates.get(key)!.asObservable();
  }
  
  getErrorState(lat: number, lon: number): Observable<string | null> {
    const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    if (!this.errorStates.has(key)) {
      this.errorStates.set(key, new BehaviorSubject<string | null>(null));
    }
    return this.errorStates.get(key)!.asObservable();
  }
  
  getForecast(lat: number, lon: number, units: 'imperial' | 'metric' = 'imperial'): Observable<DailyWeather[]> {
    const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    
    // Check cache first
    if (this.forecastCache.has(key)) {
      const cached = this.forecastCache.get(key)!.value;
      if (cached && cached.length > 0) {
        return of(cached);
      }
    } else {
      this.forecastCache.set(key, new BehaviorSubject<DailyWeather[]>([]));
    }
    
    const cache = this.forecastCache.get(key)!;
    
    return this.http.post<DailyWeather[]>(`${this.apiUrl}/weather/forecast`, {
      latitude: lat,
      longitude: lon,
      units
    }).pipe(
      tap(data => {
        cache.next(data);
      }),
      catchError(err => {
        console.error('Error fetching forecast:', err);
        return of([]);
      })
    );
  }
  
  getForecastObservable(lat: number, lon: number): Observable<DailyWeather[]> {
    const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    if (!this.forecastCache.has(key)) {
      this.forecastCache.set(key, new BehaviorSubject<DailyWeather[]>([]));
    }
    return this.forecastCache.get(key)!.asObservable();
  }
}