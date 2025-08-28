import { Injectable } from '@angular/core';
import { WeatherLocation } from '@shared/models/location.model';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private dbName = 'WeatherAppDB';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  private readonly LOCATIONS_STORE = 'locations';

  constructor() {
    this.initializeDB();
  }

  private async initializeDB(): Promise<void> {
    try {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create locations object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.LOCATIONS_STORE)) {
          const locationsStore = db.createObjectStore(this.LOCATIONS_STORE, {
            keyPath: 'id'
          });

          // Create indexes as specified in the architecture
          locationsStore.createIndex('order', 'order', { unique: false });
          locationsStore.createIndex('isPrimary', 'isPrimary', { unique: false });
          locationsStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    } catch (error) {
      console.error('Error initializing IndexedDB:', error);
      // Fall back to in-memory storage if IndexedDB fails
    }
  }

  async saveLocations(locations: WeatherLocation[]): Promise<void> {
    if (!this.db) {
      console.warn('IndexedDB not available, using fallback storage');
      localStorage.setItem('locations', JSON.stringify(locations));
      return;
    }

    try {
      const transaction = this.db.transaction([this.LOCATIONS_STORE], 'readwrite');
      const store = transaction.objectStore(this.LOCATIONS_STORE);

      // Clear existing locations
      await this.promisifyRequest(store.clear());

      // Add all locations
      for (const location of locations) {
        await this.promisifyRequest(store.add(location));
      }

      await this.promisifyTransaction(transaction);
      console.log('Locations saved to IndexedDB');
    } catch (error) {
      console.error('Error saving locations to IndexedDB:', error);
      // Fallback to localStorage
      localStorage.setItem('locations', JSON.stringify(locations));
    }
  }

  async loadLocations(): Promise<WeatherLocation[]> {
    if (!this.db) {
      console.warn('IndexedDB not available, using fallback storage');
      const stored = localStorage.getItem('locations');
      return stored ? JSON.parse(stored) : [];
    }

    try {
      const transaction = this.db.transaction([this.LOCATIONS_STORE], 'readonly');
      const store = transaction.objectStore(this.LOCATIONS_STORE);
      const request = store.getAll();

      const locations = await this.promisifyRequest<WeatherLocation[]>(request);
      console.log('Locations loaded from IndexedDB:', locations.length);
      return locations || [];
    } catch (error) {
      console.error('Error loading locations from IndexedDB:', error);
      // Fallback to localStorage
      const stored = localStorage.getItem('locations');
      return stored ? JSON.parse(stored) : [];
    }
  }

  async addLocation(location: WeatherLocation): Promise<void> {
    if (!this.db) {
      console.warn('IndexedDB not available, using fallback storage');
      const locations = await this.loadLocations();
      locations.push(location);
      localStorage.setItem('locations', JSON.stringify(locations));
      return;
    }

    try {
      const transaction = this.db.transaction([this.LOCATIONS_STORE], 'readwrite');
      const store = transaction.objectStore(this.LOCATIONS_STORE);
      await this.promisifyRequest(store.add(location));
      await this.promisifyTransaction(transaction);
      console.log('Location added to IndexedDB');
    } catch (error) {
      console.error('Error adding location to IndexedDB:', error);
      // Fallback to localStorage
      const locations = await this.loadLocations();
      locations.push(location);
      localStorage.setItem('locations', JSON.stringify(locations));
    }
  }

  async updateLocation(location: WeatherLocation): Promise<void> {
    if (!this.db) {
      console.warn('IndexedDB not available, using fallback storage');
      const locations = await this.loadLocations();
      const index = locations.findIndex(l => l.id === location.id);
      if (index !== -1) {
        locations[index] = location;
        localStorage.setItem('locations', JSON.stringify(locations));
      }
      return;
    }

    try {
      const transaction = this.db.transaction([this.LOCATIONS_STORE], 'readwrite');
      const store = transaction.objectStore(this.LOCATIONS_STORE);
      await this.promisifyRequest(store.put(location));
      await this.promisifyTransaction(transaction);
      console.log('Location updated in IndexedDB');
    } catch (error) {
      console.error('Error updating location in IndexedDB:', error);
      // Fallback to localStorage
      const locations = await this.loadLocations();
      const index = locations.findIndex(l => l.id === location.id);
      if (index !== -1) {
        locations[index] = location;
        localStorage.setItem('locations', JSON.stringify(locations));
      }
    }
  }

  async deleteLocation(id: string): Promise<void> {
    if (!this.db) {
      console.warn('IndexedDB not available, using fallback storage');
      const locations = await this.loadLocations();
      const filtered = locations.filter(l => l.id !== id);
      localStorage.setItem('locations', JSON.stringify(filtered));
      return;
    }

    try {
      const transaction = this.db.transaction([this.LOCATIONS_STORE], 'readwrite');
      const store = transaction.objectStore(this.LOCATIONS_STORE);
      await this.promisifyRequest(store.delete(id));
      await this.promisifyTransaction(transaction);
      console.log('Location deleted from IndexedDB');
    } catch (error) {
      console.error('Error deleting location from IndexedDB:', error);
      // Fallback to localStorage
      const locations = await this.loadLocations();
      const filtered = locations.filter(l => l.id !== id);
      localStorage.setItem('locations', JSON.stringify(filtered));
    }
  }

  private promisifyRequest<T = any>(request: IDBRequest): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private promisifyTransaction(transaction: IDBTransaction): Promise<void> {
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(new Error('Transaction aborted'));
    });
  }

  async clearAllData(): Promise<void> {
    if (!this.db) {
      localStorage.removeItem('locations');
      return;
    }

    try {
      const transaction = this.db.transaction([this.LOCATIONS_STORE], 'readwrite');
      const store = transaction.objectStore(this.LOCATIONS_STORE);
      await this.promisifyRequest(store.clear());
      await this.promisifyTransaction(transaction);
      console.log('All locations cleared from IndexedDB');
    } catch (error) {
      console.error('Error clearing IndexedDB:', error);
      localStorage.removeItem('locations');
    }
  }
}