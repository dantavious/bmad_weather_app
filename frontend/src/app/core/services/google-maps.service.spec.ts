import { TestBed } from '@angular/core/testing';
import { GoogleMapsService } from './google-maps.service';

// Mock Google Maps
const mockGoogle = {
  maps: {
    Map: jest.fn().mockImplementation((element: HTMLElement, options: any) => ({
      setOptions: jest.fn(),
      setCenter: jest.fn(),
      setZoom: jest.fn(),
      element,
      options
    })),
    ControlPosition: {
      TOP_RIGHT: 1,
      RIGHT_CENTER: 2
    },
    event: {
      trigger: jest.fn()
    }
  }
};

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn()
};

describe('GoogleMapsService', () => {
  let service: GoogleMapsService;
  let originalGoogle: any;
  let originalNavigator: any;

  beforeEach(() => {
    // Save originals
    originalGoogle = (window as any).google;
    originalNavigator = navigator.geolocation;
    
    // Clear window.google for fresh test
    delete (window as any).google;
    
    // Mock navigator.geolocation
    Object.defineProperty(navigator, 'geolocation', {
      value: mockGeolocation,
      configurable: true,
      writable: true
    });
    
    TestBed.configureTestingModule({});
    
    // Create service instance directly to avoid DI issues
    service = new GoogleMapsService();
  });

  afterEach(() => {
    // Restore originals
    if (originalGoogle) {
      (window as any).google = originalGoogle;
    } else {
      delete (window as any).google;
    }
    
    Object.defineProperty(navigator, 'geolocation', {
      value: originalNavigator,
      configurable: true,
      writable: true
    });
    
    // Clean up any added script tags
    const scripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
    scripts.forEach(script => script.remove());
    
    jest.clearAllMocks();
  });

  describe('loadGoogleMaps', () => {
    it('should load Google Maps script if not already loaded', (done) => {
      const loaded$ = service.loadGoogleMaps();
      
      // Find the added script
      const script = document.querySelector('script[src*="maps.googleapis.com"]') as HTMLScriptElement;
      expect(script).toBeTruthy();
      expect(script.src).toContain('maps.googleapis.com');
      expect(script.async).toBe(true);
      expect(script.defer).toBe(true);
      
      // Simulate successful load
      (window as any).google = mockGoogle;
      if (window.initMap) {
        window.initMap();
      }
      
      loaded$.subscribe({
        next: (google) => {
          expect(google).toBe(mockGoogle);
          done();
        }
      });
    });

    it('should return existing Google Maps if already loaded', (done) => {
      // Set up Google Maps as already loaded
      (window as any).google = mockGoogle;
      
      // Create new service instance to test constructor check
      const newService = new GoogleMapsService();
      
      newService.loadGoogleMaps().subscribe({
        next: (google) => {
          expect(google).toBe(mockGoogle);
          // Should not add script tag
          const scripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
          expect(scripts.length).toBe(0);
          done();
        }
      });
    });

    it('should handle script loading errors', (done) => {
      // Subscribe to error subject directly since loadGoogleMaps returns loaded$
      service.error$.subscribe({
        next: (error) => {
          expect(error.message).toContain('Failed to load Google Maps API');
          done();
        }
      });
      
      service.loadGoogleMaps().subscribe();
      
      // Find and trigger error on the script
      setTimeout(() => {
        const script = document.querySelector('script[src*="maps.googleapis.com"]') as HTMLScriptElement;
        if (script && script.onerror) {
          (script.onerror as any)(new Error('Network error'));
        }
      }, 0);
    }, 10000); // Increase timeout to 10s
  });

  describe('createMap', () => {
    it('should create a new Google Maps instance', () => {
      (window as any).google = mockGoogle;
      
      const element = document.createElement('div');
      const options = { zoom: 15, center: { lat: 0, lng: 0 } };
      
      const map = service.createMap(element, options);
      
      expect(mockGoogle.maps.Map).toHaveBeenCalledWith(
        element,
        expect.objectContaining({
          zoom: 15,
          center: { lat: 0, lng: 0 },
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true
        })
      );
      expect(map).toBeTruthy();
    });

    it('should use default options if none provided', () => {
      (window as any).google = mockGoogle;
      
      const element = document.createElement('div');
      const map = service.createMap(element);
      
      expect(mockGoogle.maps.Map).toHaveBeenCalledWith(
        element,
        expect.objectContaining({
          zoom: 10,
          center: { lat: 40.7128, lng: -74.0060 }
        })
      );
    });

    it('should throw error if Google Maps not loaded', () => {
      delete (window as any).google;
      
      const element = document.createElement('div');
      
      expect(() => service.createMap(element)).toThrow('Google Maps not loaded');
    });
  });

  describe('getUserLocation', () => {
    it('should get user location successfully', (done) => {
      const mockPosition = {
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 10
        }
      };
      
      mockGeolocation.getCurrentPosition.mockImplementation((success: any) => {
        success(mockPosition);
      });
      
      service.getUserLocation().subscribe({
        next: (position) => {
          expect(position.coords.latitude).toBe(40.7128);
          expect(position.coords.longitude).toBe(-74.0060);
          done();
        }
      });
    });

    it('should handle geolocation errors', (done) => {
      const mockError = new Error('User denied location');
      
      mockGeolocation.getCurrentPosition.mockImplementation((_: any, error: any) => {
        error(mockError);
      });
      
      service.getUserLocation().subscribe({
        error: (error) => {
          expect(error).toBe(mockError);
          done();
        }
      });
    });

    it('should handle browser without geolocation support', (done) => {
      Object.defineProperty(navigator, 'geolocation', {
        value: undefined,
        configurable: true
      });
      
      service.getUserLocation().subscribe({
        error: (error) => {
          expect(error.message).toBe('Geolocation not supported');
          done();
        }
      });
    });
  });
});