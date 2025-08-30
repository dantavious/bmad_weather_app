import { Injectable, inject, signal } from '@angular/core';
import { environment } from '../../../environments/environment';

export type WeatherLayerType = 'temp_new' | 'precipitation_new' | 'clouds_new';

export interface LayerConfig {
  id: WeatherLayerType;
  name: string;
  active: boolean;
  opacity: number;
}

export interface TileCoordinate {
  x: number;
  y: number;
}

interface CacheEntry {
  url: string;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class WeatherLayerService {
  private cache = new Map<string, CacheEntry>();
  private readonly maxCacheSize = 100;
  private readonly cacheTTL = 30 * 60 * 1000; // 30 minutes
  private readonly apiKey = environment.openWeatherMapApiKey;
  private readonly baseUrl = 'https://tile.openweathermap.org/map';

  // Layer state management with signals
  layers = signal<LayerConfig[]>([
    { id: 'temp_new', name: 'Temperature', active: false, opacity: 0.7 },
    { id: 'precipitation_new', name: 'Precipitation', active: false, opacity: 0.7 },
    { id: 'clouds_new', name: 'Clouds', active: false, opacity: 0.7 }
  ]);

  // Changed to support multiple active layers
  activeLayers = signal<WeatherLayerType[]>([]);
  
  // Compatibility property - returns the first active layer for components that expect single layer
  activeLayer = signal<WeatherLayerType | null>(null);

  /**
   * Generates tile URL for OpenWeatherMap API
   */
  getTileUrl(layerType: WeatherLayerType, coord: TileCoordinate, zoom: number): string {
    const cacheKey = `${layerType}-${zoom}-${coord.x}-${coord.y}`;
    
    // Check cache first
    const cachedUrl = this.getCachedTile(cacheKey);
    if (cachedUrl) {
      return cachedUrl;
    }

    // Generate new URL
    const url = `${this.baseUrl}/${layerType}/${zoom}/${coord.x}/${coord.y}.png?appid=${this.apiKey}`;
    
    // Cache the URL
    this.setCachedTile(cacheKey, url);
    
    return url;
  }

  /**
   * Toggles a weather layer on/off (supports multiple active layers)
   */
  toggleLayer(layerId: WeatherLayerType): void {
    this.layers.update(layers => 
      layers.map(layer => {
        if (layer.id === layerId) {
          const newActive = !layer.active;
          
          // Update activeLayers signal
          if (newActive) {
            this.activeLayers.update(active => [...active, layerId]);
          } else {
            this.activeLayers.update(active => active.filter(id => id !== layerId));
          }
          
          return { ...layer, active: newActive };
        }
        return layer;
      })
    );
    
    // Update activeLayer for backward compatibility (first active layer or null)
    const actives = this.activeLayers();
    this.activeLayer.set(actives.length > 0 ? actives[0] : null);
  }

  /**
   * Updates the opacity for a specific layer
   */
  updateLayerOpacity(layerId: WeatherLayerType, opacity: number): void {
    this.layers.update(layers => {
      return layers.map(layer => 
        layer.id === layerId 
          ? { ...layer, opacity: Math.max(0, Math.min(1, opacity)) }
          : layer
      );
    });
  }

  /**
   * Gets the current configuration for a specific layer
   */
  getLayerConfig(layerId: WeatherLayerType): LayerConfig | undefined {
    return this.layers().find(layer => layer.id === layerId);
  }

  /**
   * Retrieves a cached tile URL if valid
   */
  private getCachedTile(key: string): string | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if cache entry is still valid
    if (Date.now() - entry.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }
    
    // Move to end (LRU behavior)
    this.cache.delete(key);
    this.cache.set(key, entry);
    
    return entry.url;
  }

  /**
   * Stores a tile URL in cache with LRU eviction
   */
  private setCachedTile(key: string, url: string): void {
    // Evict oldest entry if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(key, {
      url,
      timestamp: Date.now()
    });
  }

  /**
   * Clears all cached tiles
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clears cache entries for a specific layer
   */
  clearLayerCache(layerType: WeatherLayerType): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(layerType)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Saves layer state to session storage
   */
  saveToSession(): void {
    const state = {
      layers: this.layers(),
      activeLayers: this.activeLayers()
    };
    sessionStorage.setItem('weather-layers', JSON.stringify(state));
  }

  /**
   * Restores layer state from session storage
   */
  restoreFromSession(): void {
    const stored = sessionStorage.getItem('weather-layers');
    if (stored) {
      try {
        const state = JSON.parse(stored);
        if (state.layers) {
          this.layers.set(state.layers);
          // Rebuild activeLayers from layer states
          const active = state.layers.filter((l: LayerConfig) => l.active).map((l: LayerConfig) => l.id);
          this.activeLayers.set(active);
        }
        // Handle legacy activeLayer for backwards compatibility
        if (state.activeLayer && !state.activeLayers) {
          this.activeLayers.set([state.activeLayer]);
        }
        if (state.activeLayers) {
          this.activeLayers.set(state.activeLayers);
        }
      } catch (e) {
        console.error('Failed to restore layer state from session:', e);
      }
    }
  }

  /**
   * Clears session storage
   */
  clearSession(): void {
    sessionStorage.removeItem('weather-layers');
  }
}