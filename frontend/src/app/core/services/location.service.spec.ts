import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LocationService } from './location.service';
import { WeatherLocation } from '@shared/models/location.model';
import { environment } from '../../../environments/environment';

describe('LocationService', () => {
  let service: LocationService;
  let httpMock: HttpTestingController;

  const mockLocations: WeatherLocation[] = [
    {
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
        units: 'imperial'
      }
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LocationService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(LocationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('fetchLocations', () => {
    it('should fetch locations and update subjects', (done) => {
      service.fetchLocations().subscribe(locations => {
        expect(locations).toEqual(mockLocations);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/locations`);
      expect(req.request.method).toBe('GET');
      req.flush(mockLocations);

      service.locations$.subscribe(locations => {
        expect(locations).toEqual(mockLocations);
      });
    });

    it('should handle error and return empty array', (done) => {
      service.fetchLocations().subscribe(locations => {
        expect(locations).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/locations`);
      req.flush('Error', { status: 500, statusText: 'Server Error' });

      service.error$.subscribe(error => {
        expect(error).toBe('Failed to load locations');
      });
    });
  });

  describe('getLocations', () => {
    it('should return current locations value', () => {
      service.fetchLocations().subscribe();
      
      const req = httpMock.expectOne(`${environment.apiUrl}/locations`);
      req.flush(mockLocations);

      expect(service.getLocations()).toEqual(mockLocations);
    });
  });

  describe('getLocationById', () => {
    it('should return location with matching id', () => {
      service.fetchLocations().subscribe();
      
      const req = httpMock.expectOne(`${environment.apiUrl}/locations`);
      req.flush(mockLocations);

      const location = service.getLocationById('1');
      expect(location).toEqual(mockLocations[0]);
    });

    it('should return undefined for non-existent id', () => {
      service.fetchLocations().subscribe();
      
      const req = httpMock.expectOne(`${environment.apiUrl}/locations`);
      req.flush(mockLocations);

      const location = service.getLocationById('999');
      expect(location).toBeUndefined();
    });
  });

  describe('loading state', () => {
    it('should emit loading states correctly', (done) => {
      const loadingStates: boolean[] = [];
      
      service.loading$.subscribe(loading => {
        loadingStates.push(loading);
      });

      service.fetchLocations().subscribe(() => {
        expect(loadingStates).toEqual([false, true, false]);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/locations`);
      req.flush(mockLocations);
    });
  });
});