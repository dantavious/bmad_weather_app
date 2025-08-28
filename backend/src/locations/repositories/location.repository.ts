import { Injectable } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { WeatherLocation } from '@shared/models/location.model';

@Injectable()
export class LocationRepository {
  private readonly locations: WeatherLocation[] = [
    {
      id: '1',
      name: 'New York, NY',
      latitude: 40.7128,
      longitude: -74.006,
      isPrimary: true,
      order: 0,
      createdAt: new Date(),
      settings: {
        alertsEnabled: true,
        units: 'imperial',
      },
    },
    {
      id: '2',
      name: 'Los Angeles, CA',
      latitude: 34.0522,
      longitude: -118.2437,
      isPrimary: false,
      order: 1,
      createdAt: new Date(),
      settings: {
        alertsEnabled: true,
        units: 'imperial',
      },
    },
    {
      id: '3',
      name: 'Chicago, IL',
      latitude: 41.8781,
      longitude: -87.6298,
      isPrimary: false,
      order: 2,
      createdAt: new Date(),
      settings: {
        alertsEnabled: false,
        units: 'imperial',
      },
    },
  ];

  findAll(): Observable<WeatherLocation[]> {
    // In a real app, this would be from a database query returning an Observable
    return of(this.locations);
  }

  findById(id: string): Observable<WeatherLocation | undefined> {
    return of(this.locations.find((location) => location.id === id));
  }

  create(
    location: Omit<WeatherLocation, 'id' | 'createdAt'>,
  ): Observable<WeatherLocation> {
    const newLocation: WeatherLocation = {
      ...location,
      id: (this.locations.length + 1).toString(),
      createdAt: new Date(),
    };
    this.locations.push(newLocation);
    return of(newLocation);
  }

  update(
    id: string,
    updates: Partial<WeatherLocation>,
  ): Observable<WeatherLocation | undefined> {
    const index = this.locations.findIndex((loc) => loc.id === id);
    if (index !== -1) {
      this.locations[index] = { ...this.locations[index], ...updates };
      return of(this.locations[index]);
    }
    return of(undefined);
  }

  delete(id: string): Observable<boolean> {
    const index = this.locations.findIndex((loc) => loc.id === id);
    if (index !== -1) {
      this.locations.splice(index, 1);
      return of(true);
    }
    return of(false);
  }
}
