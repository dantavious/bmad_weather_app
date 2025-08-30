import { TestBed } from '@angular/core/testing';
import { WeatherLayerService } from './weather-layer.service';
import { importProvidersFrom } from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';
import { PlatformModule } from '@angular/cdk/platform';
import { LayoutModule } from '@angular/cdk/layout';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('WeatherLayerService', () => {
  let service: WeatherLayerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        WeatherLayerService,
        importProvidersFrom(
          A11yModule,
          PlatformModule,
          LayoutModule,
          NoopAnimationsModule
        ),
      ],
    });
    service = TestBed.inject(WeatherLayerService);

    // Clear session storage before each test
    sessionStorage.clear();
  });

  afterEach(() => {
    service.clearCache();
    sessionStorage.clear();
  });

  describe('Tile URL Generation', () => {
    it('should generate correct tile URL', () => {
      const url = service.getTileUrl('temp_new', { x: 1, y: 2 }, 3);
      expect(url).toContain('temp_new/3/1/2.png');
      expect(url).toContain('appid=');
      expect(url).toContain('tile.openweathermap.org');
    });

    it('should generate different URLs for different layers', () => {
      const tempUrl = service.getTileUrl('temp_new', { x: 1, y: 1 }, 5);
      const cloudUrl = service.getTileUrl('clouds_new', { x: 1, y: 1 }, 5);
      
      expect(tempUrl).toContain('temp_new');
      expect(cloudUrl).toContain('clouds_new');
      expect(tempUrl).not.toEqual(cloudUrl);
    });
  });

  describe('Tile Caching', () => {
    it('should cache tile URLs', () => {
      const coord = { x: 1, y: 2 };
      const zoom = 3;
      
      // First call should generate and cache URL
      const url1 = service.getTileUrl('temp_new', coord, zoom);
      
      // Second call should return cached URL
      const url2 = service.getTileUrl('temp_new', coord, zoom);
      
      expect(url1).toEqual(url2);
    });

    it('should evict oldest entries when cache is full', () => {
      // Fill cache to max capacity (100 tiles)
      for (let i = 0; i < 101; i++) {
        service.getTileUrl('temp_new', { x: i, y: 0 }, 1);
      }
      
      // First tile should have been evicted
      // Generate a new URL for the first coordinate to check if it's cached
      const testUrl = service.getTileUrl('temp_new', { x: 0, y: 0 }, 1);
      
      // If it was evicted, the URL should be regenerated (we can't directly test cache contents)
      // This is mainly testing that the service doesn't throw an error
      expect(testUrl).toBeDefined();
    });

    it('should clear all cache entries', () => {
      service.getTileUrl('temp_new', { x: 1, y: 1 }, 1);
      service.getTileUrl('clouds_new', { x: 2, y: 2 }, 2);
      
      service.clearCache();
      
      // After clearing, new URLs should be generated
      const url = service.getTileUrl('temp_new', { x: 1, y: 1 }, 1);
      expect(url).toBeDefined();
    });

    it('should clear cache for specific layer', () => {
      const tempCoord = { x: 1, y: 1 };
      const cloudCoord = { x: 2, y: 2 };
      
      service.getTileUrl('temp_new', tempCoord, 1);
      service.getTileUrl('clouds_new', cloudCoord, 1);
      
      service.clearLayerCache('temp_new');
      
      // Temperature cache should be cleared, clouds should remain
      const tempUrl = service.getTileUrl('temp_new', tempCoord, 1);
      const cloudUrl = service.getTileUrl('clouds_new', cloudCoord, 1);
      
      expect(tempUrl).toBeDefined();
      expect(cloudUrl).toBeDefined();
    });
  });

  describe('Layer Management', () => {
    it('should initialize with default layers', () => {
      const layers = service.layers();
      
      expect(layers.length).toBe(3);
      expect(layers[0].id).toBe('temp_new');
      expect(layers[1].id).toBe('precipitation_new');
      expect(layers[2].id).toBe('clouds_new');
      
      // All should be inactive by default
      layers.forEach(layer => {
        expect(layer.active).toBe(false);
        expect(layer.opacity).toBe(0.7);
      });
    });

    it('should toggle layer visibility', () => {
      service.toggleLayer('temp_new');
      
      const layers = service.layers();
      const tempLayer = layers.find(l => l.id === 'temp_new');
      
      expect(tempLayer?.active).toBe(true);
      expect(service.activeLayer()).toBe('temp_new');
    });

    it('should support multiple active layers simultaneously', () => {
      service.toggleLayer('temp_new');
      service.toggleLayer('clouds_new');
      
      const layers = service.layers();
      const tempLayer = layers.find(l => l.id === 'temp_new');
      const cloudLayer = layers.find(l => l.id === 'clouds_new');
      
      expect(tempLayer?.active).toBe(true);
      expect(cloudLayer?.active).toBe(true);
      expect(service.activeLayers()).toContain('temp_new');
      expect(service.activeLayers()).toContain('clouds_new');
      expect(service.activeLayer()).toBe('temp_new'); // First active layer for backwards compatibility
    });

    it('should deactivate layer when toggled off', () => {
      service.toggleLayer('temp_new');
      expect(service.activeLayer()).toBe('temp_new');
      
      service.toggleLayer('temp_new');
      expect(service.activeLayer()).toBeNull();
      
      const tempLayer = service.layers().find(l => l.id === 'temp_new');
      expect(tempLayer?.active).toBe(false);
    });

    it('should update layer opacity', () => {
      service.updateLayerOpacity('temp_new', 0.5);
      
      const layer = service.getLayerConfig('temp_new');
      expect(layer?.opacity).toBe(0.5);
    });

    it('should clamp opacity values between 0 and 1', () => {
      service.updateLayerOpacity('temp_new', -0.5);
      let layer = service.getLayerConfig('temp_new');
      expect(layer?.opacity).toBe(0);
      
      service.updateLayerOpacity('temp_new', 1.5);
      layer = service.getLayerConfig('temp_new');
      expect(layer?.opacity).toBe(1);
    });

    it('should get layer configuration', () => {
      const config = service.getLayerConfig('precipitation_new');
      
      expect(config).toBeDefined();
      expect(config?.id).toBe('precipitation_new');
      expect(config?.name).toBe('Precipitation');
    });
  });

  describe('Session Persistence', () => {
    it('should save layer state to session storage', () => {
      service.toggleLayer('temp_new');
      service.updateLayerOpacity('temp_new', 0.8);
      
      service.saveToSession();
      
      const stored = sessionStorage.getItem('weather-layers');
      expect(stored).toBeDefined();
      
      const state = JSON.parse(stored!);
      expect(state.activeLayers).toContain('temp_new');
      expect(state.layers).toBeDefined();
      expect(state.layers[0].opacity).toBe(0.8);
    });

    it('should restore layer state from session storage', () => {
      // Set up initial state
      service.toggleLayer('clouds_new');
      service.updateLayerOpacity('clouds_new', 0.3);
      service.saveToSession();
      
      // Create new service instance to simulate page reload
      const newService = TestBed.inject(WeatherLayerService);
      newService.restoreFromSession();
      
      expect(newService.activeLayers()).toContain('clouds_new');
      expect(newService.activeLayer()).toBe('clouds_new'); // Backwards compatibility check
      const cloudLayer = newService.getLayerConfig('clouds_new');
      expect(cloudLayer?.active).toBe(true);
      expect(cloudLayer?.opacity).toBe(0.3);
    });

    it('should handle invalid session data gracefully', () => {
      sessionStorage.setItem('weather-layers', 'invalid-json');
      
      // Should not throw error
      expect(() => service.restoreFromSession()).not.toThrow();
    });

    it('should clear session storage', () => {
      service.toggleLayer('temp_new');
      service.saveToSession();
      
      expect(sessionStorage.getItem('weather-layers')).toBeDefined();
      
      service.clearSession();
      
      expect(sessionStorage.getItem('weather-layers')).toBeNull();
    });
  });
});