import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Observable, of, throwError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { LocationRepository } from '../repositories/location.repository';
import { WeatherLocation } from '@shared/models/location.model';

@Injectable()
export class LocationService {
  private readonly MAX_LOCATIONS = 5;

  constructor(private readonly locationRepository: LocationRepository) {}

  findAll(): Observable<WeatherLocation[]> {
    return this.locationRepository.findAll();
  }

  findById(id: string): Observable<WeatherLocation | undefined> {
    return this.locationRepository
      .findAll()
      .pipe(
        map((locations) => locations.find((location) => location.id === id)),
      );
  }

  findByCoordinates(
    latitude: number,
    longitude: number,
  ): Observable<WeatherLocation | undefined> {
    return this.locationRepository
      .findAll()
      .pipe(
        map((locations) =>
          locations.find(
            (location) =>
              Math.abs(location.latitude - latitude) < 0.01 &&
              Math.abs(location.longitude - longitude) < 0.01,
          ),
        ),
      );
  }

  create(locationData: {
    name: string;
    latitude: number;
    longitude: number;
    country?: string;
    state?: string;
  }): Observable<WeatherLocation> {
    return this.locationRepository.findAll().pipe(
      switchMap((locations) => {
        // Check location limit
        if (locations.length >= this.MAX_LOCATIONS) {
          return throwError(
            () =>
              new HttpException(
                `Maximum number of locations (${this.MAX_LOCATIONS}) reached`,
                HttpStatus.BAD_REQUEST,
              ),
          );
        }

        // Check for duplicate location (by coordinates)
        const exists = locations.some(
          (loc) =>
            Math.abs(loc.latitude - locationData.latitude) < 0.01 &&
            Math.abs(loc.longitude - locationData.longitude) < 0.01,
        );

        if (exists) {
          return throwError(
            () =>
              new HttpException('Location already exists', HttpStatus.CONFLICT),
          );
        }

        // Create new location
        const newLocation: Omit<WeatherLocation, 'id' | 'createdAt'> = {
          name: locationData.name,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          isPrimary: locations.length === 0, // First location is primary
          order: locations.length,
          settings: {
            alertsEnabled: true,
            units: 'imperial',
          },
        };

        return this.locationRepository.create(newLocation);
      }),
    );
  }

  delete(id: string): Observable<boolean> {
    return this.locationRepository.delete(id);
  }

  update(
    id: string,
    updates: Partial<WeatherLocation>,
  ): Observable<WeatherLocation | undefined> {
    return this.locationRepository.update(id, updates);
  }
}
