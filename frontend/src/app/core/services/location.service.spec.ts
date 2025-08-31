import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { LocationService } from './location.service';
import { StorageService } from './storage.service';
import { AlertService } from './alert.service';
import { NotificationService } from './notification.service';
import { WeatherLocation } from '@shared/models/location.model';
import { environment } from '../../../environments/environment';
import { importProvidersFrom } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HighContrastModeDetector } from '@angular/cdk/a11y';
import { PlatformModule } from '@angular/cdk/platform';
import { LayoutModule } from '@angular/cdk/layout';
import { of } from 'rxjs';

describe('LocationService', () => {
  let service: LocationService;
  let httpMock: HttpTestingController;
  let storageService: jest.Mocked<StorageService>;
  let mockAlertService: any;
  let mockNotificationService: any;

  const mockLocations: WeatherLocation[] = [
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
  ];

  beforeEach(() => {
    const spy = {
      loadLocations: jest.fn().mockResolvedValue(mockLocations),
      saveLocations: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
    };

    mockAlertService = {
      fetchAlerts: jest.fn().mockReturnValue(of([])),
      clearAlerts: jest.fn(),
      clearAllAlerts: jest.fn(),
    };

    mockNotificationService = {
      notificationPermission: { set: jest.fn() },
      preferences: { set: jest.fn() },
      requestPermission: jest.fn().mockResolvedValue('granted'),
      sendNotification: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        LocationService,
        { provide: StorageService, useValue: spy },
        { provide: AlertService, useValue: mockAlertService },
        { provide: NotificationService, useValue: mockNotificationService },
        provideHttpClient(),
        provideHttpClientTesting(),
        importProvidersFrom(NoopAnimationsModule, PlatformModule, LayoutModule),
        {
          provide: HighContrastModeDetector,
          useValue: {
            _applyBodyHighContrastModeCssClasses: () => {},
          },
        },
      ],
    });
    service = TestBed.inject(LocationService);
    httpMock = TestBed.inject(HttpTestingController);
    storageService = TestBed.inject(
      StorageService
    ) as jest.Mocked<StorageService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('fetchLocations', () => {
    it('should fetch locations and update subjects', fakeAsync(() => {
      service.fetchLocations().subscribe();
      tick();

      const req = httpMock.expectOne(`${environment.apiUrl}/locations`);
      expect(req.request.method).toBe('GET');
      req.flush(mockLocations);
      tick();

      expect(service.locations()).toEqual(mockLocations);
    }));

    it('should handle error and return empty array', fakeAsync(() => {
      service.fetchLocations().subscribe();
      tick();

      const req = httpMock.expectOne(`${environment.apiUrl}/locations`);
      req.flush('Error', { status: 500, statusText: 'Server Error' });
      tick();

      expect(service.locations()).toEqual([]);
      service.error$.subscribe(error => {
        expect(error).toBe('Failed to load locations');
      });
    }));
  });

  describe('getLocations', () => {
    it('should return current locations value', () => {
      service['locationsSignal'].set(mockLocations);
      expect(service.locations()).toEqual(mockLocations);
    });
  });

  describe('getLocationById', () => {
    it('should return location with matching id', () => {
      service['locationsSignal'].set(mockLocations);
      const location = service.getLocationById('1');
      expect(location).toEqual(mockLocations[0]);
    });

    it('should return undefined for non-existent id', () => {
      service['locationsSignal'].set(mockLocations);
      const location = service.getLocationById('999');
      expect(location).toBeUndefined();
    });
  });

  describe('reorderLocations', () => {
    it('should reorder locations and update order properties', fakeAsync(() => {
      service['locationsSignal'].set(mockLocations);
      service.reorderLocations(0, 1);
      tick();

      const locations = service.locations();
      expect(locations[0].name).toBe('Los Angeles, CA');
      expect(locations[0].order).toBe(0);
      expect(locations[1].name).toBe('New York, NY');
      expect(locations[1].order).toBe(1);
      expect(storageService.saveLocations).toHaveBeenCalled();
    }));
  });

  describe('setPrimaryLocation', () => {
    it('should set only one location as primary', fakeAsync(() => {
      service['locationsSignal'].set(mockLocations);
      service.setPrimaryLocation('2');
      tick();

      const locations = service.locations();
      expect(locations[0].isPrimary).toBe(false);
      expect(locations[1].isPrimary).toBe(true);
      expect(storageService.saveLocations).toHaveBeenCalled();
    }));
  });

  describe('updateLocationName', () => {
    it('should update the name of a specific location', fakeAsync(() => {
      service['locationsSignal'].set(mockLocations);
      service.updateLocationName('1', 'New York City');
      tick();

      const locations = service.locations();
      expect(locations[0].name).toBe('New York City');
      expect(storageService.saveLocations).toHaveBeenCalled();
    }));
  });

  describe('deleteLocation', () => {
    it('should delete a location and update the list', fakeAsync(() => {
      service['locationsSignal'].set(mockLocations);
      service.deleteLocation('1').subscribe();
      tick();

      const req = httpMock.expectOne(`${environment.apiUrl}/locations/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(true);
      tick();

      const locations = service.locations();
      expect(locations.length).toBe(1);
      expect(locations[0].id).toBe('2');
      expect(storageService.saveLocations).toHaveBeenCalled();
    }));
  });

  describe('addLocation', () => {
    it('should add a new location and maintain order', fakeAsync(() => {
      service['locationsSignal'].set(mockLocations);
      const newLocation: WeatherLocation = {
        id: '3',
        name: 'San Francisco',
        latitude: 37.7749,
        longitude: -122.4194,
        isPrimary: false,
        order: 2,
        createdAt: new Date(),
        settings: { alertsEnabled: false, units: 'imperial' },
      };

      service.addLocation(newLocation).subscribe();
      tick();

      const req = httpMock.expectOne(`${environment.apiUrl}/locations`);
      expect(req.request.method).toBe('POST');
      req.flush(newLocation);
      tick();

      const locations = service.locations();
      expect(locations.length).toBe(3);
      expect(locations[2].name).toBe('San Francisco');
      expect(storageService.saveLocations).toHaveBeenCalled();
    }));
  });
});
