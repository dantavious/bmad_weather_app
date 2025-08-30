import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { StorageService } from './storage.service';
import { WeatherLocation } from '@shared/models/location.model';
import { HttpClientTestingModule } from '@angular/common/http/testing';

// Mock structuredClone for Jest
if (!global.structuredClone) {
  global.structuredClone = (val: any) => JSON.parse(JSON.stringify(val));
}

// Mock localStorage for Jest
const mockLocalStorage = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('StorageService', () => {
  let service: StorageService;

  const mockLocation: WeatherLocation = {
    id: '1',
    name: 'New York',
    latitude: 40.71,
    longitude: -74.01,
    isPrimary: true,
    order: 0,
    createdAt: new Date(),
    settings: {
      alertsEnabled: true,
      units: 'imperial'
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [StorageService],
    });
    service = TestBed.inject(StorageService);
    localStorage.clear();
  });

  afterEach(fakeAsync(() => {
    if (service) {
      service.clearAllData();
    }
    tick();
    TestBed.resetTestingModule();
  }));

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize IndexedDB on creation', fakeAsync(() => {
    tick();
  }));

  it('should save locations to IndexedDB', fakeAsync(() => {
    const locations = [mockLocation];
    service.saveLocations(locations);
    tick();

    service.loadLocations().then(loadedLocations => {
      expect(loadedLocations).toEqual(locations);
    });
    tick();
  }));

  it('should load locations from IndexedDB', fakeAsync(() => {
    service.saveLocations([mockLocation]);
    tick();

    service.loadLocations().then(locations => {
      expect(locations).toEqual([mockLocation]);
    });
    tick();
  }));

  it('should add a location', fakeAsync(() => {
    service.addLocation(mockLocation);
    tick();
    service.loadLocations().then(locations => {
      expect(locations).toContainEqual(mockLocation);
    });
    tick();
  }));

  it('should update a location', fakeAsync(() => {
    service.addLocation(mockLocation);
    tick();
    const updatedLocation = { ...mockLocation, name: 'New New York' };
    service.updateLocation(updatedLocation);
    tick();
    service.loadLocations().then(locations => {
      expect(locations).toContainEqual(updatedLocation);
    });
    tick();
  }));

  it('should delete a location', fakeAsync(() => {
    service.addLocation(mockLocation);
    tick();
    service.deleteLocation('1');
    tick();
    service.loadLocations().then(locations => {
      expect(locations).toEqual([]);
    });
    tick();
  }));

  it('should clear all data', fakeAsync(() => {
    service.addLocation(mockLocation);
    tick();
    service.clearAllData();
    tick();
    service.loadLocations().then(locations => {
      expect(locations).toEqual([]);
    });
    tick();
  }));
});