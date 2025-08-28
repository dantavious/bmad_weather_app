import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage.service';
import { WeatherLocation } from '@shared/models/location.model';

describe('StorageService', () => {
  let service: StorageService;
  let mockIndexedDB: any;
  let mockIDBDatabase: any;
  let mockIDBTransaction: any;
  let mockIDBObjectStore: any;

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
    // Mock IndexedDB
    mockIDBObjectStore = {
      add: jasmine.createSpy('add').and.returnValue({ 
        onsuccess: null, 
        onerror: null,
        result: mockLocation 
      }),
      put: jasmine.createSpy('put').and.returnValue({ 
        onsuccess: null, 
        onerror: null,
        result: mockLocation 
      }),
      delete: jasmine.createSpy('delete').and.returnValue({ 
        onsuccess: null, 
        onerror: null,
        result: true 
      }),
      clear: jasmine.createSpy('clear').and.returnValue({ 
        onsuccess: null, 
        onerror: null,
        result: undefined 
      }),
      getAll: jasmine.createSpy('getAll').and.returnValue({ 
        onsuccess: null, 
        onerror: null,
        result: [mockLocation] 
      }),
      createIndex: jasmine.createSpy('createIndex')
    };

    mockIDBTransaction = {
      objectStore: jasmine.createSpy('objectStore').and.returnValue(mockIDBObjectStore),
      oncomplete: null,
      onerror: null,
      onabort: null
    };

    mockIDBDatabase = {
      transaction: jasmine.createSpy('transaction').and.returnValue(mockIDBTransaction),
      objectStoreNames: {
        contains: jasmine.createSpy('contains').and.returnValue(false)
      },
      createObjectStore: jasmine.createSpy('createObjectStore').and.returnValue(mockIDBObjectStore)
    };

    const mockOpenRequest = {
      onsuccess: null as any,
      onerror: null as any,
      onupgradeneeded: null as any,
      result: mockIDBDatabase
    };

    mockIndexedDB = {
      open: jasmine.createSpy('open').and.returnValue(mockOpenRequest)
    };

    // Replace global indexedDB
    (window as any).indexedDB = mockIndexedDB;

    TestBed.configureTestingModule({
      providers: [StorageService]
    });
    
    service = TestBed.inject(StorageService);

    // Trigger successful DB initialization
    const openRequest = mockIndexedDB.open.calls.mostRecent().returnValue;
    if (openRequest.onsuccess) {
      openRequest.onsuccess();
    }
    (service as any).db = mockIDBDatabase;
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize IndexedDB on creation', () => {
    expect(mockIndexedDB.open).toHaveBeenCalledWith('WeatherAppDB', 1);
  });

  it('should save locations to IndexedDB', async () => {
    const locations = [mockLocation];
    
    // Setup successful transaction
    const clearRequest = { onsuccess: null as any, onerror: null };
    const addRequest = { onsuccess: null as any, onerror: null };
    mockIDBObjectStore.clear.and.returnValue(clearRequest);
    mockIDBObjectStore.add.and.returnValue(addRequest);

    const savePromise = service.saveLocations(locations);
    
    // Simulate successful operations
    if (clearRequest.onsuccess) clearRequest.onsuccess();
    if (addRequest.onsuccess) addRequest.onsuccess();
    if (mockIDBTransaction.oncomplete) mockIDBTransaction.oncomplete();

    await savePromise;

    expect(mockIDBObjectStore.clear).toHaveBeenCalled();
    expect(mockIDBObjectStore.add).toHaveBeenCalledWith(mockLocation);
  });

  it('should fall back to localStorage when IndexedDB is not available', async () => {
    (service as any).db = null;
    const locations = [mockLocation];

    await service.saveLocations(locations);

    expect(localStorage.getItem('locations')).toBe(JSON.stringify(locations));
  });

  it('should load locations from IndexedDB', async () => {
    const getAllRequest = {
      onsuccess: null as any,
      onerror: null,
      result: [mockLocation]
    };
    mockIDBObjectStore.getAll.and.returnValue(getAllRequest);

    const loadPromise = service.loadLocations();
    
    // Simulate successful operation
    if (getAllRequest.onsuccess) {
      getAllRequest.onsuccess();
    }

    const locations = await loadPromise;

    expect(mockIDBObjectStore.getAll).toHaveBeenCalled();
    expect(locations).toEqual([mockLocation]);
  });

  it('should load locations from localStorage when IndexedDB is not available', async () => {
    (service as any).db = null;
    localStorage.setItem('locations', JSON.stringify([mockLocation]));

    const locations = await service.loadLocations();

    expect(locations).toEqual([mockLocation]);
  });

  it('should add a location', async () => {
    const addRequest = { onsuccess: null as any, onerror: null };
    mockIDBObjectStore.add.and.returnValue(addRequest);

    const addPromise = service.addLocation(mockLocation);
    
    if (addRequest.onsuccess) addRequest.onsuccess();
    if (mockIDBTransaction.oncomplete) mockIDBTransaction.oncomplete();

    await addPromise;

    expect(mockIDBObjectStore.add).toHaveBeenCalledWith(mockLocation);
  });

  it('should update a location', async () => {
    const putRequest = { onsuccess: null as any, onerror: null };
    mockIDBObjectStore.put.and.returnValue(putRequest);

    const updatePromise = service.updateLocation(mockLocation);
    
    if (putRequest.onsuccess) putRequest.onsuccess();
    if (mockIDBTransaction.oncomplete) mockIDBTransaction.oncomplete();

    await updatePromise;

    expect(mockIDBObjectStore.put).toHaveBeenCalledWith(mockLocation);
  });

  it('should delete a location', async () => {
    const deleteRequest = { onsuccess: null as any, onerror: null };
    mockIDBObjectStore.delete.and.returnValue(deleteRequest);

    const deletePromise = service.deleteLocation('1');
    
    if (deleteRequest.onsuccess) deleteRequest.onsuccess();
    if (mockIDBTransaction.oncomplete) mockIDBTransaction.oncomplete();

    await deletePromise;

    expect(mockIDBObjectStore.delete).toHaveBeenCalledWith('1');
  });

  it('should clear all data', async () => {
    const clearRequest = { onsuccess: null as any, onerror: null };
    mockIDBObjectStore.clear.and.returnValue(clearRequest);

    const clearPromise = service.clearAllData();
    
    if (clearRequest.onsuccess) clearRequest.onsuccess();
    if (mockIDBTransaction.oncomplete) mockIDBTransaction.oncomplete();

    await clearPromise;

    expect(mockIDBObjectStore.clear).toHaveBeenCalled();
  });

  it('should handle IndexedDB errors and fall back to localStorage', async () => {
    const addRequest = { 
      onsuccess: null as any, 
      onerror: null as any,
      error: new Error('IndexedDB error')
    };
    mockIDBObjectStore.add.and.returnValue(addRequest);

    const addPromise = service.addLocation(mockLocation);
    
    // Simulate error
    if (addRequest.onerror) addRequest.onerror();

    await addPromise;

    // Should fall back to localStorage
    const stored = localStorage.getItem('locations');
    expect(stored).toBeTruthy();
    const parsedLocations = JSON.parse(stored!);
    expect(parsedLocations).toContain(jasmine.objectContaining({ id: '1' }));
  });

  it('should handle transaction abort', async () => {
    spyOn(console, 'error');
    
    const savePromise = service.saveLocations([mockLocation]);
    
    // Simulate transaction abort
    if (mockIDBTransaction.onabort) mockIDBTransaction.onabort();

    try {
      await savePromise;
    } catch (error) {
      // Expected to catch error
    }

    expect(console.error).toHaveBeenCalled();
  });

  it('should create proper indexes during upgrade', () => {
    const openRequest = mockIndexedDB.open.calls.mostRecent().returnValue;
    const event = {
      target: { result: mockIDBDatabase }
    };

    if (openRequest.onupgradeneeded) {
      openRequest.onupgradeneeded(event);
    }

    expect(mockIDBDatabase.createObjectStore).toHaveBeenCalledWith(
      'locations',
      { keyPath: 'id' }
    );
    expect(mockIDBObjectStore.createIndex).toHaveBeenCalledWith('order', 'order', { unique: false });
    expect(mockIDBObjectStore.createIndex).toHaveBeenCalledWith('isPrimary', 'isPrimary', { unique: false });
    expect(mockIDBObjectStore.createIndex).toHaveBeenCalledWith('createdAt', 'createdAt', { unique: false });
  });
});