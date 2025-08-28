import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of, from } from 'rxjs';
import { catchError, tap, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { WeatherLocation } from '@shared/models/location.model';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class LocationService {
  private readonly http = inject(HttpClient);
  private readonly storageService = inject(StorageService);
  private readonly apiUrl = environment.apiUrl;
  
  private locationsSubject = new BehaviorSubject<WeatherLocation[]>([]);
  public locations$ = this.locationsSubject.asObservable();
  
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();
  
  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  constructor() {
    // Load saved locations on initialization
    this.loadSavedLocations();
  }

  private async loadSavedLocations(): Promise<void> {
    try {
      const savedLocations = await this.storageService.loadLocations();
      if (savedLocations.length > 0) {
        this.locationsSubject.next(savedLocations);
      }
    } catch (error) {
      console.error('Error loading saved locations:', error);
    }
  }

  fetchLocations(): Observable<WeatherLocation[]> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);
    
    return this.http.get<WeatherLocation[]>(`${this.apiUrl}/locations`).pipe(
      tap(locations => {
        this.locationsSubject.next(locations);
        this.loadingSubject.next(false);
        // Save to IndexedDB
        this.storageService.saveLocations(locations);
      }),
      catchError(error => {
        console.error('Error fetching locations:', error);
        this.errorSubject.next('Failed to load locations');
        this.loadingSubject.next(false);
        return of([]);
      })
    );
  }
  
  getLocations(): Observable<WeatherLocation[]> {
    return of(this.locationsSubject.value);
  }
  
  getLocationById(id: string): WeatherLocation | undefined {
    return this.locationsSubject.value.find(loc => loc.id === id);
  }

  addLocation(location: WeatherLocation): Observable<WeatherLocation> {
    return this.http.post<WeatherLocation>(`${this.apiUrl}/locations`, location).pipe(
      tap(newLocation => {
        const current = this.locationsSubject.value;
        const updated = [...current, newLocation];
        this.locationsSubject.next(updated);
        // Save to IndexedDB
        this.storageService.saveLocations(updated);
      })
    );
  }

  deleteLocation(id: string): Observable<boolean> {
    return this.http.delete<boolean>(`${this.apiUrl}/locations/${id}`).pipe(
      tap(() => {
        const current = this.locationsSubject.value;
        const updated = current.filter(loc => loc.id !== id);
        this.locationsSubject.next(updated);
        // Save to IndexedDB
        this.storageService.saveLocations(updated);
      })
    );
  }

  updateLocation(id: string, updates: Partial<WeatherLocation>): Observable<WeatherLocation | undefined> {
    return this.http.put<WeatherLocation>(`${this.apiUrl}/locations/${id}`, updates).pipe(
      tap(updatedLocation => {
        if (updatedLocation) {
          const current = this.locationsSubject.value;
          const index = current.findIndex(loc => loc.id === id);
          if (index !== -1) {
            current[index] = updatedLocation;
            this.locationsSubject.next([...current]);
            // Save to IndexedDB
            this.storageService.saveLocations(current);
          }
        }
      })
    );
  }
}