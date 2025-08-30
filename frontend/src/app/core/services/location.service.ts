import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of, from, combineLatest } from 'rxjs';
import { catchError, tap, switchMap, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { WeatherLocation } from '@shared/models/location.model';
import { StorageService } from './storage.service';
import { AlertService, WeatherAlert } from './alert.service';

@Injectable({ providedIn: 'root' })
export class LocationService {
  private readonly http = inject(HttpClient);
  private readonly storageService = inject(StorageService);
  private readonly alertService = inject(AlertService);
  private readonly apiUrl = environment.apiUrl;
  
  private locationsSubject = new BehaviorSubject<WeatherLocation[]>([]);
  public locations$ = this.locationsSubject.asObservable();
  
  // Signal-based state for new components
  private locationsSignal = signal<WeatherLocation[]>([]);
  public locations = computed(() => this.locationsSignal());
  
  // Alerts state
  private locationAlertsMap = new Map<string, signal<WeatherAlert[]>>();
  
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();
  
  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  constructor() {
    // Load saved locations on initialization
    this.loadSavedLocations();
    
    // Auto-save locations when they change
    effect(() => {
      const locations = this.locationsSignal();
      if (locations.length > 0) {
        this.storageService.saveLocations(locations);
      }
    });
  }

  private async loadSavedLocations(): Promise<void> {
    try {
      const savedLocations = await this.storageService.loadLocations();
      if (savedLocations.length > 0) {
        this.locationsSubject.next(savedLocations);
        this.locationsSignal.set(savedLocations);
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
        this.locationsSignal.set(locations);
        this.loadingSubject.next(false);
        // Save to IndexedDB
        this.storageService.saveLocations(locations);
      }),
      catchError(error => {
        console.error('Error fetching locations:', error);
        this.errorSubject.next('Failed to load locations');
        this.loadingSubject.next(false);
        this.locationsSignal.set([]);
        return of([]);
      })
    );
  }
  
  getLocations(): WeatherLocation[] {
    return this.locationsSignal();
  }
  
  getLocationById(id: string): WeatherLocation | undefined {
    return this.locationsSignal().find(loc => loc.id === id);
  }

  addLocation(location: WeatherLocation): Observable<WeatherLocation> {
    return this.http.post<WeatherLocation>(`${this.apiUrl}/locations`, location).pipe(
      tap(newLocation => {
        const current = this.locationsSignal();
        const updated = [...current, newLocation];
        this.locationsSubject.next(updated);
        this.locationsSignal.set(updated);
        // Save to IndexedDB
        this.storageService.saveLocations(updated);
      })
    );
  }

  deleteLocation(id: string): Observable<boolean> {
    return this.http.delete<boolean>(`${this.apiUrl}/locations/${id}`).pipe(
      tap(() => {
        const current = this.locationsSignal();
        const updated = current.filter(loc => loc.id !== id);
        this.locationsSubject.next(updated);
        this.locationsSignal.set(updated);
        // Save to IndexedDB
        this.storageService.saveLocations(updated);
      })
    );
  }

  updateLocation(id: string, updates: Partial<WeatherLocation>): Observable<WeatherLocation | undefined> {
    return this.http.put<WeatherLocation>(`${this.apiUrl}/locations/${id}`, updates).pipe(
      tap(updatedLocation => {
        if (updatedLocation) {
          const current = this.locationsSignal();
          const index = current.findIndex(loc => loc.id === id);
          if (index !== -1) {
            current[index] = updatedLocation;
            this.locationsSubject.next([...current]);
            this.locationsSignal.set([...current]);
            // Save to IndexedDB
            this.storageService.saveLocations(current);
          }
        }
      })
    );
  }
  
  reorderLocations(fromIndex: number, toIndex: number): void {
    const locations = [...this.locationsSignal()];
    
    // Manual array reordering (replacing moveItemInArray from CDK)
    const [movedItem] = locations.splice(fromIndex, 1);
    locations.splice(toIndex, 0, movedItem);
    
    // Update order property for each location
    const updatedLocations = locations.map((loc, index) => ({
      ...loc,
      order: index
    }));
    
    this.locationsSignal.set(updatedLocations);
    this.locationsSubject.next(updatedLocations);
    
    this.storageService.saveLocations(updatedLocations);
  }
  
  setPrimaryLocation(id: string): void {
    const locations = this.locationsSignal();
    const updatedLocations = locations.map(loc => ({
      ...loc,
      isPrimary: loc.id === id
    }));
    
    this.locationsSignal.set(updatedLocations);
    this.locationsSubject.next(updatedLocations);
    
    this.storageService.saveLocations(updatedLocations);
  }
  
  updateLocationName(id: string, name: string): void {
    const locations = this.locationsSignal();
    const updatedLocations = locations.map(loc => 
      loc.id === id ? { ...loc, name } : loc
    );
    
    this.locationsSignal.set(updatedLocations);
    this.locationsSubject.next(updatedLocations);
    
    this.storageService.saveLocations(updatedLocations);
  }
  
  // Alert management methods
  startAlertMonitoring(location: WeatherLocation): void {
    if (!this.locationAlertsMap.has(location.id)) {
      const alertsSignal = signal<WeatherAlert[]>([]);
      this.locationAlertsMap.set(location.id, alertsSignal);
      
      // Subscribe to alerts for this location
      this.alertService.fetchAlerts(location.id, location.latitude, location.longitude)
        .subscribe(alerts => {
          const locationSignal = this.locationAlertsMap.get(location.id);
          if (locationSignal) {
            locationSignal.set(alerts);
          }
        });
    }
  }
  
  stopAlertMonitoring(locationId: string): void {
    this.locationAlertsMap.delete(locationId);
    this.alertService.clearAlerts(locationId);
  }
  
  getAlertsForLocation(locationId: string): signal<WeatherAlert[]> {
    let alertsSignal = this.locationAlertsMap.get(locationId);
    if (!alertsSignal) {
      alertsSignal = signal<WeatherAlert[]>([]);
      this.locationAlertsMap.set(locationId, alertsSignal);
    }
    return alertsSignal;
  }
  
  startAllAlertMonitoring(): void {
    const locations = this.locationsSignal();
    locations.forEach(location => {
      this.startAlertMonitoring(location);
    });
  }
  
  stopAllAlertMonitoring(): void {
    this.locationAlertsMap.clear();
    this.alertService.clearAllAlerts();
  }
}