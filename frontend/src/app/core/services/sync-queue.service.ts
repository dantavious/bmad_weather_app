import { Injectable, inject, signal, effect } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';

interface QueuedRequest {
  id?: number;
  timestamp: number;
  endpoint: string;
  method: string;
  payload?: any;
  retryCount: number;
  maxRetries: number;
}

@Injectable({ providedIn: 'root' })
export class SyncQueueService {
  private swUpdate = inject(SwUpdate);
  private db: IDBDatabase | null = null;
  private dbName = 'BMadWeatherDB';
  private storeName = 'syncQueue';
  
  private queueSize = signal(0);
  private syncInProgress = signal(false);
  private lastSyncTime = signal<Date | null>(null);
  
  readonly hasQueuedRequests = signal(false);
  readonly isSyncing = this.syncInProgress.asReadonly();
  
  constructor() {
    this.initializeDB();
    this.registerBackgroundSync();
    
    effect(() => {
      this.hasQueuedRequests.set(this.queueSize() > 0);
    });
    
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then(registration => {
        this.checkQueueSize();
      });
    }
  }
  
  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 2);
      
      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        this.checkQueueSize();
        resolve();
      };
      
      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('endpoint', 'endpoint', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('queuedAlerts')) {
          db.createObjectStore('queuedAlerts', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
        }
        
        if (!db.objectStoreNames.contains('weatherCache')) {
          db.createObjectStore('weatherCache', { keyPath: 'locationId' });
        }
      };
    });
  }
  
  async queueRequest(
    endpoint: string,
    method: string = 'POST',
    payload?: any,
    maxRetries: number = 3
  ): Promise<void> {
    if (!this.db) {
      await this.initializeDB();
    }
    
    const request: QueuedRequest = {
      timestamp: Date.now(),
      endpoint,
      method,
      payload,
      retryCount: 0,
      maxRetries
    };
    
    const transaction = this.db!.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    
    return new Promise((resolve, reject) => {
      const addRequest = store.add(request);
      
      addRequest.onsuccess = () => {
        this.checkQueueSize();
        this.requestBackgroundSync();
        resolve();
      };
      
      addRequest.onerror = () => {
        console.error('Failed to queue request:', addRequest.error);
        reject(addRequest.error);
      };
    });
  }
  
  async getQueuedRequests(): Promise<QueuedRequest[]> {
    if (!this.db) {
      await this.initializeDB();
    }
    
    const transaction = this.db!.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);
    
    return new Promise((resolve, reject) => {
      const getRequest = store.getAll();
      
      getRequest.onsuccess = () => {
        resolve(getRequest.result || []);
      };
      
      getRequest.onerror = () => {
        console.error('Failed to get queued requests:', getRequest.error);
        reject(getRequest.error);
      };
    });
  }
  
  async removeRequest(id: number): Promise<void> {
    if (!this.db) {
      await this.initializeDB();
    }
    
    const transaction = this.db!.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    
    return new Promise((resolve, reject) => {
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => {
        this.checkQueueSize();
        resolve();
      };
      
      deleteRequest.onerror = () => {
        console.error('Failed to remove request:', deleteRequest.error);
        reject(deleteRequest.error);
      };
    });
  }
  
  async updateRetryCount(id: number, retryCount: number): Promise<void> {
    if (!this.db) {
      await this.initializeDB();
    }
    
    const transaction = this.db!.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    
    return new Promise((resolve, reject) => {
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const request = getRequest.result;
        if (request) {
          request.retryCount = retryCount;
          const updateRequest = store.put(request);
          
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve();
        }
      };
      
      getRequest.onerror = () => reject(getRequest.error);
    });
  }
  
  private async checkQueueSize(): Promise<void> {
    if (!this.db) return;
    
    const transaction = this.db.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);
    const countRequest = store.count();
    
    countRequest.onsuccess = () => {
      this.queueSize.set(countRequest.result);
    };
  }
  
  private async registerBackgroundSync(): Promise<void> {
    if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
      console.log('Background sync not supported');
      return;
    }
    
    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register('weather-sync');
      console.log('Background sync registered');
    } catch (error) {
      console.error('Failed to register background sync:', error);
    }
  }
  
  async requestBackgroundSync(): Promise<void> {
    if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
      await this.processQueue();
      return;
    }
    
    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register('weather-sync');
    } catch (error) {
      console.error('Failed to request background sync:', error);
      await this.processQueue();
    }
  }
  
  async processQueue(): Promise<void> {
    if (this.syncInProgress()) {
      console.log('Sync already in progress');
      return;
    }
    
    this.syncInProgress.set(true);
    
    try {
      const requests = await this.getQueuedRequests();
      console.log(`Processing ${requests.length} queued requests`);
      
      for (const request of requests) {
        try {
          const response = await fetch(request.endpoint, {
            method: request.method,
            headers: {
              'Content-Type': 'application/json'
            },
            body: request.payload ? JSON.stringify(request.payload) : undefined
          });
          
          if (response.ok) {
            await this.removeRequest(request.id!);
            console.log(`Successfully synced request ${request.id}`);
          } else if (response.status >= 400 && response.status < 500) {
            await this.removeRequest(request.id!);
            console.error(`Request ${request.id} failed with client error, removing from queue`);
          } else {
            await this.handleRetry(request);
          }
        } catch (error) {
          console.error(`Failed to sync request ${request.id}:`, error);
          await this.handleRetry(request);
        }
      }
      
      this.lastSyncTime.set(new Date());
    } finally {
      this.syncInProgress.set(false);
      await this.checkQueueSize();
    }
  }
  
  private async handleRetry(request: QueuedRequest): Promise<void> {
    const nextRetryCount = request.retryCount + 1;
    
    if (nextRetryCount >= request.maxRetries) {
      console.error(`Max retries reached for request ${request.id}, removing from queue`);
      await this.removeRequest(request.id!);
    } else {
      await this.updateRetryCount(request.id!, nextRetryCount);
      console.log(`Will retry request ${request.id} (attempt ${nextRetryCount}/${request.maxRetries})`);
      
      const backoffDelay = Math.min(1000 * Math.pow(2, nextRetryCount), 30000);
      setTimeout(() => this.requestBackgroundSync(), backoffDelay);
    }
  }
  
  async clearQueue(): Promise<void> {
    if (!this.db) {
      await this.initializeDB();
    }
    
    const transaction = this.db!.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    
    return new Promise((resolve, reject) => {
      const clearRequest = store.clear();
      
      clearRequest.onsuccess = () => {
        this.queueSize.set(0);
        resolve();
      };
      
      clearRequest.onerror = () => {
        console.error('Failed to clear queue:', clearRequest.error);
        reject(clearRequest.error);
      };
    });
  }
  
  getSyncStatus(): { queued: number; syncing: boolean; lastSync: Date | null } {
    return {
      queued: this.queueSize(),
      syncing: this.syncInProgress(),
      lastSync: this.lastSyncTime()
    };
  }
}