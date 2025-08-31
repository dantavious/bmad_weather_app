import { TestBed } from '@angular/core/testing';
import { SwUpdate } from '@angular/service-worker';
import { SyncQueueService } from './sync-queue.service';

describe('SyncQueueService', () => {
  let service: SyncQueueService;
  let mockSwUpdate: jasmine.SpyObj<SwUpdate>;
  let mockIndexedDB: any;
  let mockDB: any;
  let mockObjectStore: any;
  let mockTransaction: any;

  beforeEach(() => {
    mockSwUpdate = jasmine.createSpyObj('SwUpdate', [], {
      isEnabled: true
    });

    mockObjectStore = {
      add: jasmine.createSpy('add').and.returnValue({
        onsuccess: null,
        onerror: null,
        result: 1
      }),
      get: jasmine.createSpy('get').and.returnValue({
        onsuccess: null,
        onerror: null,
        result: null
      }),
      getAll: jasmine.createSpy('getAll').and.returnValue({
        onsuccess: null,
        onerror: null,
        result: []
      }),
      delete: jasmine.createSpy('delete').and.returnValue({
        onsuccess: null,
        onerror: null
      }),
      put: jasmine.createSpy('put').and.returnValue({
        onsuccess: null,
        onerror: null
      }),
      clear: jasmine.createSpy('clear').and.returnValue({
        onsuccess: null,
        onerror: null
      }),
      count: jasmine.createSpy('count').and.returnValue({
        onsuccess: null,
        onerror: null,
        result: 0
      })
    };

    mockTransaction = {
      objectStore: jasmine.createSpy('objectStore').and.returnValue(mockObjectStore)
    };

    mockDB = {
      transaction: jasmine.createSpy('transaction').and.returnValue(mockTransaction),
      objectStoreNames: {
        contains: jasmine.createSpy('contains').and.returnValue(true)
      }
    };

    mockIndexedDB = {
      open: jasmine.createSpy('open').and.returnValue({
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
        result: mockDB
      })
    };

    spyOn(window, 'indexedDB').and.returnValue(mockIndexedDB as any);

    TestBed.configureTestingModule({
      providers: [
        SyncQueueService,
        { provide: SwUpdate, useValue: mockSwUpdate }
      ]
    });
  });

  describe('Queue operations', () => {
    beforeEach(() => {
      const openRequest = mockIndexedDB.open();
      service = TestBed.inject(SyncQueueService);
      
      setTimeout(() => {
        if (openRequest.onsuccess) {
          openRequest.onsuccess();
        }
      }, 0);
    });

    it('should queue a request', async () => {
      const addRequest = mockObjectStore.add();
      
      const queuePromise = service.queueRequest('/api/test', 'POST', { data: 'test' });
      
      setTimeout(() => {
        if (addRequest.onsuccess) {
          addRequest.onsuccess();
        }
      }, 0);
      
      await queuePromise;
      
      expect(mockObjectStore.add).toHaveBeenCalledWith(jasmine.objectContaining({
        endpoint: '/api/test',
        method: 'POST',
        payload: { data: 'test' },
        retryCount: 0,
        maxRetries: 3
      }));
    });

    it('should get queued requests', async () => {
      const testRequests = [
        { id: 1, endpoint: '/api/test1', method: 'POST' },
        { id: 2, endpoint: '/api/test2', method: 'GET' }
      ];
      
      const getAllRequest = mockObjectStore.getAll();
      getAllRequest.result = testRequests;
      
      const getPromise = service.getQueuedRequests();
      
      setTimeout(() => {
        if (getAllRequest.onsuccess) {
          getAllRequest.onsuccess();
        }
      }, 0);
      
      const requests = await getPromise;
      
      expect(requests).toEqual(testRequests);
    });

    it('should remove a request', async () => {
      const deleteRequest = mockObjectStore.delete();
      
      const removePromise = service.removeRequest(1);
      
      setTimeout(() => {
        if (deleteRequest.onsuccess) {
          deleteRequest.onsuccess();
        }
      }, 0);
      
      await removePromise;
      
      expect(mockObjectStore.delete).toHaveBeenCalledWith(1);
    });

    it('should clear the queue', async () => {
      const clearRequest = mockObjectStore.clear();
      
      const clearPromise = service.clearQueue();
      
      setTimeout(() => {
        if (clearRequest.onsuccess) {
          clearRequest.onsuccess();
        }
      }, 0);
      
      await clearPromise;
      
      expect(mockObjectStore.clear).toHaveBeenCalled();
    });
  });

  describe('Retry logic', () => {
    beforeEach(() => {
      const openRequest = mockIndexedDB.open();
      service = TestBed.inject(SyncQueueService);
      
      setTimeout(() => {
        if (openRequest.onsuccess) {
          openRequest.onsuccess();
        }
      }, 0);
    });

    it('should update retry count', async () => {
      const testRequest = { 
        id: 1, 
        endpoint: '/api/test', 
        retryCount: 0 
      };
      
      const getRequest = mockObjectStore.get();
      getRequest.result = testRequest;
      
      const putRequest = mockObjectStore.put();
      
      const updatePromise = service.updateRetryCount(1, 1);
      
      setTimeout(() => {
        if (getRequest.onsuccess) {
          getRequest.onsuccess();
        }
        setTimeout(() => {
          if (putRequest.onsuccess) {
            putRequest.onsuccess();
          }
        }, 0);
      }, 0);
      
      await updatePromise;
      
      expect(mockObjectStore.put).toHaveBeenCalledWith(jasmine.objectContaining({
        retryCount: 1
      }));
    });
  });

  describe('Background sync', () => {
    let mockServiceWorker: any;
    let mockRegistration: any;
    let mockSync: any;

    beforeEach(() => {
      mockSync = {
        register: jasmine.createSpy('register').and.returnValue(Promise.resolve())
      };

      mockRegistration = {
        sync: mockSync
      };

      mockServiceWorker = {
        ready: Promise.resolve(mockRegistration)
      };

      Object.defineProperty(navigator, 'serviceWorker', {
        value: mockServiceWorker,
        configurable: true
      });

      const openRequest = mockIndexedDB.open();
      service = TestBed.inject(SyncQueueService);
      
      setTimeout(() => {
        if (openRequest.onsuccess) {
          openRequest.onsuccess();
        }
      }, 0);
    });

    it('should register background sync', async () => {
      await service.requestBackgroundSync();
      expect(mockSync.register).toHaveBeenCalledWith('weather-sync');
    });

    it('should process queue when background sync is not available', async () => {
      Object.defineProperty(window, 'SyncManager', {
        value: undefined,
        configurable: true
      });
      
      spyOn(service, 'processQueue');
      await service.requestBackgroundSync();
      
      expect(service.processQueue).toHaveBeenCalled();
    });
  });

  describe('Queue processing', () => {
    beforeEach(() => {
      const openRequest = mockIndexedDB.open();
      service = TestBed.inject(SyncQueueService);
      
      setTimeout(() => {
        if (openRequest.onsuccess) {
          openRequest.onsuccess();
        }
      }, 0);
    });

    it('should process successful requests', async () => {
      const testRequests = [{
        id: 1,
        endpoint: '/api/test',
        method: 'POST',
        payload: { data: 'test' },
        retryCount: 0,
        maxRetries: 3
      }];
      
      spyOn(service, 'getQueuedRequests').and.returnValue(Promise.resolve(testRequests));
      spyOn(service, 'removeRequest').and.returnValue(Promise.resolve());
      spyOn(window, 'fetch').and.returnValue(
        Promise.resolve(new Response('', { status: 200 }))
      );
      
      await service.processQueue();
      
      expect(window.fetch).toHaveBeenCalledWith('/api/test', jasmine.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: 'test' })
      }));
      expect(service.removeRequest).toHaveBeenCalledWith(1);
    });

    it('should handle failed requests with retry', async () => {
      const testRequests = [{
        id: 1,
        endpoint: '/api/test',
        method: 'POST',
        retryCount: 0,
        maxRetries: 3
      }];
      
      spyOn(service, 'getQueuedRequests').and.returnValue(Promise.resolve(testRequests));
      spyOn(service, 'updateRetryCount').and.returnValue(Promise.resolve());
      spyOn(window, 'fetch').and.returnValue(
        Promise.resolve(new Response('', { status: 500 }))
      );
      
      await service.processQueue();
      
      expect(service.updateRetryCount).toHaveBeenCalledWith(1, 1);
    });

    it('should remove requests after max retries', async () => {
      const testRequests = [{
        id: 1,
        endpoint: '/api/test',
        method: 'POST',
        retryCount: 2,
        maxRetries: 3
      }];
      
      spyOn(service, 'getQueuedRequests').and.returnValue(Promise.resolve(testRequests));
      spyOn(service, 'removeRequest').and.returnValue(Promise.resolve());
      spyOn(window, 'fetch').and.returnValue(
        Promise.resolve(new Response('', { status: 500 }))
      );
      
      await service.processQueue();
      
      expect(service.removeRequest).toHaveBeenCalledWith(1);
    });
  });

  describe('Sync status', () => {
    beforeEach(() => {
      const openRequest = mockIndexedDB.open();
      service = TestBed.inject(SyncQueueService);
      
      setTimeout(() => {
        if (openRequest.onsuccess) {
          openRequest.onsuccess();
        }
      }, 0);
    });

    it('should return sync status', () => {
      const status = service.getSyncStatus();
      
      expect(status).toEqual({
        queued: 0,
        syncing: false,
        lastSync: null
      });
    });

    it('should update has queued requests signal', async () => {
      const countRequest = mockObjectStore.count();
      countRequest.result = 2;
      
      setTimeout(() => {
        if (countRequest.onsuccess) {
          countRequest.onsuccess();
        }
      }, 0);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(service.hasQueuedRequests()).toBeTruthy();
    });
  });
});