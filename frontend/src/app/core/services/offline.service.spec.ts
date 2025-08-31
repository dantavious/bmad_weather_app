import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { OfflineService } from './offline.service';

describe('OfflineService', () => {
  let service: OfflineService;
  let originalNavigatorOnLine: any;

  beforeEach(() => {
    originalNavigatorOnLine = Object.getOwnPropertyDescriptor(window.Navigator.prototype, 'onLine');
    
    TestBed.configureTestingModule({
      providers: [OfflineService]
    });
  });

  afterEach(() => {
    if (originalNavigatorOnLine) {
      Object.defineProperty(window.Navigator.prototype, 'onLine', originalNavigatorOnLine);
    }
  });

  describe('Initial state', () => {
    it('should detect online status on initialization', () => {
      setNavigatorOnline(true);
      service = TestBed.inject(OfflineService);
      expect(service.isOnline()).toBeTruthy();
      expect(service.isOffline()).toBeFalsy();
      expect(service.connectionStatus()).toBe('online');
    });

    it('should detect offline status on initialization', () => {
      setNavigatorOnline(false);
      service = TestBed.inject(OfflineService);
      expect(service.isOnline()).toBeFalsy();
      expect(service.isOffline()).toBeTruthy();
      expect(service.connectionStatus()).toBe('offline');
    });
  });

  describe('Connection events', () => {
    beforeEach(() => {
      setNavigatorOnline(true);
      service = TestBed.inject(OfflineService);
    });

    it('should update status on offline event', fakeAsync(() => {
      setNavigatorOnline(false);
      window.dispatchEvent(new Event('offline'));
      tick(301);
      
      expect(service.isOffline()).toBeTruthy();
      expect(service.connectionStatus()).toBe('offline');
    }));

    it('should update status on online event', fakeAsync(() => {
      setNavigatorOnline(false);
      window.dispatchEvent(new Event('offline'));
      tick(301);
      
      setNavigatorOnline(true);
      window.dispatchEvent(new Event('online'));
      tick(301);
      
      expect(service.isOnline()).toBeTruthy();
      expect(service.connectionStatus()).toBe('online');
    }));

    it('should debounce rapid connection changes', fakeAsync(() => {
      const initialStatus = service.isOnline();
      
      window.dispatchEvent(new Event('offline'));
      tick(100);
      window.dispatchEvent(new Event('online'));
      tick(100);
      window.dispatchEvent(new Event('offline'));
      tick(100);
      
      expect(service.isOnline()).toBe(initialStatus);
      
      tick(201);
      setNavigatorOnline(false);
      expect(service.isOffline()).toBeTruthy();
    }));
  });

  describe('Connectivity checking', () => {
    beforeEach(() => {
      service = TestBed.inject(OfflineService);
    });

    it('should return true when fetch succeeds', async () => {
      spyOn(window, 'fetch').and.returnValue(
        Promise.resolve(new Response('', { status: 200 }))
      );
      
      const result = await service.checkConnectivity();
      expect(result).toBeTruthy();
      expect(service.isOnline()).toBeTruthy();
    });

    it('should return false when fetch fails', async () => {
      spyOn(window, 'fetch').and.returnValue(
        Promise.reject(new Error('Network error'))
      );
      
      const result = await service.checkConnectivity();
      expect(result).toBeFalsy();
      expect(service.isOffline()).toBeTruthy();
    });

    it('should return false when fetch returns non-ok status', async () => {
      spyOn(window, 'fetch').and.returnValue(
        Promise.resolve(new Response('', { status: 404 }))
      );
      
      const result = await service.checkConnectivity();
      expect(result).toBeFalsy();
      expect(service.isOffline()).toBeTruthy();
    });
  });

  describe('Offline duration tracking', () => {
    beforeEach(() => {
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date('2024-01-01T12:00:00'));
    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });

    it('should track offline duration', fakeAsync(() => {
      setNavigatorOnline(true);
      service = TestBed.inject(OfflineService);
      
      setNavigatorOnline(false);
      window.dispatchEvent(new Event('offline'));
      tick(301);
      
      jasmine.clock().tick(120000);
      
      const duration = service.offlineDuration();
      expect(duration).toBe(120000);
    }));

    it('should return null when online', () => {
      setNavigatorOnline(true);
      service = TestBed.inject(OfflineService);
      expect(service.offlineDuration()).toBeNull();
    });
  });

  describe('Offline messages', () => {
    beforeEach(() => {
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date('2024-01-01T12:00:00'));
      setNavigatorOnline(true);
      service = TestBed.inject(OfflineService);
    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });

    it('should return basic message when just offline', fakeAsync(() => {
      setNavigatorOnline(false);
      window.dispatchEvent(new Event('offline'));
      tick(301);
      
      expect(service.getOfflineMessage()).toBe('You are currently offline');
    }));

    it('should return minute-based message', fakeAsync(() => {
      setNavigatorOnline(false);
      window.dispatchEvent(new Event('offline'));
      tick(301);
      
      jasmine.clock().tick(60000);
      expect(service.getOfflineMessage()).toBe('You have been offline for 1 minute');
      
      jasmine.clock().tick(60000);
      expect(service.getOfflineMessage()).toBe('You have been offline for 2 minutes');
    }));

    it('should return hour-based message', fakeAsync(() => {
      setNavigatorOnline(false);
      window.dispatchEvent(new Event('offline'));
      tick(301);
      
      jasmine.clock().tick(3600000);
      expect(service.getOfflineMessage()).toBe('You have been offline for 1 hour');
      
      jasmine.clock().tick(3600000);
      expect(service.getOfflineMessage()).toBe('You have been offline for 2 hours');
    }));
  });

  describe('Periodic connectivity check', () => {
    it('should check connectivity every 5 seconds', fakeAsync(() => {
      jasmine.clock().install();
      setNavigatorOnline(true);
      service = TestBed.inject(OfflineService);
      
      setNavigatorOnline(false);
      jasmine.clock().tick(5001);
      
      expect(service.isOffline()).toBeTruthy();
      
      setNavigatorOnline(true);
      jasmine.clock().tick(5001);
      
      expect(service.isOnline()).toBeTruthy();
      jasmine.clock().uninstall();
    }));
  });

  function setNavigatorOnline(online: boolean): void {
    Object.defineProperty(window.Navigator.prototype, 'onLine', {
      configurable: true,
      get() { return online; }
    });
  }
});