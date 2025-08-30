/// <reference types="@types/google.maps" />
import { Component, ViewChild, ElementRef, AfterViewInit, OnDestroy, signal, inject, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { Subject, takeUntil, switchMap, of, catchError, from } from 'rxjs';
import { Observable } from 'rxjs';
import { GoogleMapsService } from '../../core/services/google-maps.service';
import { WeatherService } from '../../core/services/weather.service';
import { LocationService } from '../../core/services/location.service';
import { WeatherLayerService, WeatherLayerType, LayerConfig } from '../../core/services/weather-layer.service';
import { LayerControlComponent } from './components/layer-control/layer-control.component';
import { WeatherLegendComponent } from './components/weather-legend/weather-legend.component';
import { MapContextMenuComponent } from './components/map-context-menu/map-context-menu.component';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

// Interface for recent location tracking
interface RecentLocation {
  lat: number;
  lng: number;
  weather?: any;
  locationName?: string;
  timestamp: number;
}

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatBottomSheetModule,
    LayerControlComponent,
    WeatherLegendComponent
  ],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef<HTMLElement>;
  
  private googleMapsService = inject(GoogleMapsService);
  private weatherLayerService = inject(WeatherLayerService);
  private weatherService = inject(WeatherService);
  private locationService = inject(LocationService);
  private snackBar = inject(MatSnackBar);
  private bottomSheet = inject(MatBottomSheet);
  private http = inject(HttpClient);
  private overlay = inject(Overlay);
  private destroy$ = new Subject<void>();
  private contextMenuRef?: OverlayRef;
  
  // Signals for state management
  isLoading = signal(true);
  hasError = signal(false);
  errorMessage = signal('');
  isFullscreen = signal(false);
  map = signal<google.maps.Map | null>(null);
  
  // Map instance
  private googleMap?: google.maps.Map;
  private resizeObserver?: ResizeObserver;
  
  // Weather overlay management - now supports multiple layers
  private weatherOverlays = new Map<WeatherLayerType, google.maps.ImageMapType>();
  // Track the order of layers for consistent stacking
  private readonly layerOrder: WeatherLayerType[] = ['clouds_new', 'precipitation_new', 'temp_new'];
  
  // Recent locations tracking
  recentLocations = signal<Map<string, RecentLocation>>(new Map());
  private recentLocationMarkers: google.maps.Marker[] = [];
  
  // Mobile long-press detection
  private longPressTimer?: number;
  private isLongPress = false;
  
  constructor() {
    // Effect to handle fullscreen changes
    effect(() => {
      if (this.isFullscreen()) {
        this.enterFullscreen();
      } else {
        this.exitFullscreen();
      }
    });
    
    // Effect to handle weather layer changes
    effect(() => {
      const layers = this.weatherLayerService.layers();
      if (this.googleMap) {
        this.updateWeatherOverlays(layers);
      }
    });
  }
  
  ngAfterViewInit(): void {
    // Restore session state
    this.weatherLayerService.restoreFromSession();
    this.initializeMap();
  }
  
  
  private initializeMap(): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    
    // Load Google Maps
    this.googleMapsService.loadGoogleMaps()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.requestUserLocation();
        },
        error: (error) => {
          console.error('Failed to load Google Maps:', error);
          this.handleMapError('Failed to load Google Maps. Please check your internet connection.');
        }
      });
  }
  
  private requestUserLocation(): void {
    this.googleMapsService.getUserLocation()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (position) => {
          const center = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          this.createMap(center);
        },
        error: (error) => {
          console.warn('Could not get user location:', error);
          // Use default location (NYC)
          const defaultCenter = { lat: 40.7128, lng: -74.0060 };
          this.createMap(defaultCenter);
          
          // Show info message
          this.snackBar.open(
            'Location access denied. Showing default location.',
            'OK',
            { duration: 3000 }
          );
        }
      });
  }
  
  private createMap(center: google.maps.LatLngLiteral): void {
    try {
      const mapOptions: google.maps.MapOptions = {
        center,
        zoom: 12,
        mapTypeControl: true,
        fullscreenControl: false, // We'll use our own fullscreen button
        streetViewControl: false,
        zoomControl: true,
        gestureHandling: 'greedy', // Better for mobile
        mapTypeControlOptions: {
          position: google.maps.ControlPosition.TOP_RIGHT
        },
        zoomControlOptions: {
          position: google.maps.ControlPosition.RIGHT_CENTER
        }
      };
      
      this.googleMap = this.googleMapsService.createMap(
        this.mapContainer.nativeElement,
        mapOptions
      );
      
      this.map.set(this.googleMap);
      this.isLoading.set(false);
      
      // Add resize listener
      this.setupResizeListener();
      
      // Setup touch gestures for mobile
      this.setupMobileGestures();
      
      // Setup click and long-press handlers
      this.setupMapClickHandlers();
      
    } catch (error) {
      console.error('Error creating map:', error);
      this.handleMapError('Failed to initialize map. Please try again.');
    }
  }
  
  private setupResizeListener(): void {
    if (!this.googleMap) return;
    
    this.resizeObserver = new ResizeObserver(() => {
      if (this.googleMap) {
        google.maps.event.trigger(this.googleMap, 'resize');
      }
    });
    
    this.resizeObserver.observe(this.mapContainer.nativeElement);
  }
  
  private setupMobileGestures(): void {
    if (!this.googleMap) return;
    
    // Check if mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    
    if (isMobile) {
      // Enable cooperative gesture handling on mobile to prevent accidental scrolling
      this.googleMap.setOptions({
        gestureHandling: 'greedy'
      });
    }
  }
  
  private handleMapError(message: string): void {
    this.isLoading.set(false);
    this.hasError.set(true);
    this.errorMessage.set(message);
    
    this.snackBar.open(message, 'Retry', { duration: 5000 })
      .onAction()
      .subscribe(() => {
        this.retryMapLoad();
      });
  }
  
  retryMapLoad(): void {
    this.hasError.set(false);
    this.initializeMap();
  }
  
  toggleFullscreen(): void {
    this.isFullscreen.update(value => !value);
  }
  
  private enterFullscreen(): void {
    const elem = this.mapContainer.nativeElement.parentElement;
    if (elem) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      }
    }
  }
  
  private exitFullscreen(): void {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  }
  
  /**
   * Updates all weather overlays on the map based on layer states
   */
  private updateWeatherOverlays(layers: LayerConfig[]): void {
    if (!this.googleMap) return;
    
    // Clear all overlays first to ensure proper ordering
    this.googleMap!.overlayMapTypes.clear();
    
    // Add overlays in the defined order to ensure consistent stacking
    this.layerOrder.forEach(layerType => {
      const layer = layers.find(l => l.id === layerType);
      if (!layer) return;
      
      if (layer.active) {
        let overlay = this.weatherOverlays.get(layer.id);
        
        if (!overlay) {
          // Create new overlay
          overlay = this.createWeatherOverlay(layer.id, layer.opacity);
          this.weatherOverlays.set(layer.id, overlay);
        } else {
          // Update opacity
          overlay.setOpacity(layer.opacity);
        }
        
        // Add to map at specific index
        this.googleMap!.overlayMapTypes.push(overlay);
        console.log(`Added overlay ${layer.id} at index ${this.googleMap?.overlayMapTypes.getLength() ? this.googleMap.overlayMapTypes.getLength() - 1 : 0}`);
      } else {
        // Remove from tracking if inactive
        const overlay = this.weatherOverlays.get(layer.id);
        if (overlay) {
          this.weatherOverlays.delete(layer.id);
        }
      }
    });
    
    console.log(`Total overlays active: ${this.googleMap?.overlayMapTypes.getLength() || 0}`);
  }
  
  /**
   * Creates a weather tile overlay (does not add to map)
   */
  private createWeatherOverlay(layerType: WeatherLayerType, opacity: number): google.maps.ImageMapType {
    console.log(`Creating weather overlay: ${layerType} with opacity ${opacity}`);
    
    // Create the ImageMapType for weather tiles
    const overlay = new google.maps.ImageMapType({
      getTileUrl: (coord: google.maps.Point, zoom: number) => {
        // Normalize tile coordinates (Google Maps can pass negative coords)
        const normalizedCoord = this.getNormalizedCoord(coord, zoom);
        if (!normalizedCoord) {
          return null;
        }
        
        const url = this.weatherLayerService.getTileUrl(
          layerType,
          { x: normalizedCoord.x, y: normalizedCoord.y },
          zoom
        );
        return url;
      },
      tileSize: new google.maps.Size(256, 256),
      opacity: opacity,
      name: layerType,
      alt: `Weather overlay: ${layerType}`,
      maxZoom: 19,
      minZoom: 1
    });
    
    return overlay;
  }
  
  /**
   * Adds a weather tile overlay to the map (legacy method for compatibility)
   */
  private addWeatherOverlay(layerType: WeatherLayerType, opacity: number): void {
    if (!this.googleMap) return;
    
    // Don't add if already exists
    if (this.weatherOverlays.has(layerType)) return;
    
    const overlay = this.createWeatherOverlay(layerType, opacity);
    
    // Store reference
    this.weatherOverlays.set(layerType, overlay);
    
    // Add to map overlays
    this.googleMap.overlayMapTypes.push(overlay);
    console.log(`Added overlay ${layerType}. Total overlays: ${this.googleMap.overlayMapTypes.getLength()}`);
  }
  
  /**
   * Removes a specific weather overlay from the map
   */
  private removeWeatherOverlay(layerType: WeatherLayerType): void {
    if (!this.googleMap) return;
    
    const overlay = this.weatherOverlays.get(layerType);
    if (!overlay) return;
    
    console.log(`Removing weather overlay: ${layerType}`);
    
    // Find and remove the overlay from map
    const overlays = this.googleMap.overlayMapTypes;
    for (let i = 0; i < overlays.getLength(); i++) {
      if (overlays.getAt(i) === overlay) {
        overlays.removeAt(i);
        break;
      }
    }
    
    // Remove from our tracking map
    this.weatherOverlays.delete(layerType);
    console.log(`Removed overlay ${layerType}. Total overlays: ${this.googleMap.overlayMapTypes.getLength()}`);
  }
  
  /**
   * Removes all weather overlays from the map
   */
  private removeAllWeatherOverlays(): void {
    if (!this.googleMap) return;
    
    // Remove each overlay
    this.weatherOverlays.forEach((overlay, layerType) => {
      this.removeWeatherOverlay(layerType);
    });
    
    // Clear the map
    this.weatherOverlays.clear();
  }
  
  /**
   * Normalizes tile coordinates to handle wrapping
   */
  private getNormalizedCoord(coord: google.maps.Point, zoom: number): google.maps.Point | null {
    const y = coord.y;
    let x = coord.x;
    
    // Tile range in one direction (2^zoom tiles)
    const tileRange = 1 << zoom;
    
    // Don't show tiles outside the valid range
    if (y < 0 || y >= tileRange) {
      return null;
    }
    
    // Wrap x around to stay within valid range
    if (x < 0 || x >= tileRange) {
      x = ((x % tileRange) + tileRange) % tileRange;
    }
    
    return new google.maps.Point(x, y);
  }
  
  /**
   * Sets up click and long-press event handlers for the map
   */
  private setupMapClickHandlers(): void {
    if (!this.googleMap) return;
    
    // Handle regular click for desktop and tap for mobile
    this.googleMap.addListener('click', (event: google.maps.MapMouseEvent) => {
      // Prevent click if it was a long press
      if (this.isLongPress) {
        this.isLongPress = false;
        return;
      }
      
      if (event.latLng) {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        this.handleMapClick(lat, lng);
      }
    });
    
    // Handle right-click for desktop context menu
    this.googleMap.addListener('rightclick', (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        this.showContextMenu(lat, lng, event);
      }
    });
    
    // Setup touch handlers for mobile long-press
    const mapDiv = this.mapContainer.nativeElement;
    let touchStartTime: number;
    let touchStartCoords: { x: number; y: number };
    
    mapDiv.addEventListener('touchstart', (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartTime = Date.now();
        touchStartCoords = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        
        // Start long-press timer
        this.longPressTimer = window.setTimeout(() => {
          this.isLongPress = true;
          
          // Convert touch coordinates to lat/lng
          if (this.googleMap) {
            const bounds = this.googleMap.getBounds();
            const projection = this.googleMap.getProjection();
            
            if (bounds && projection) {
              // Get map container bounds
              const rect = mapDiv.getBoundingClientRect();
              
              // Calculate relative position within map
              const x = touchStartCoords.x - rect.left;
              const y = touchStartCoords.y - rect.top;
              
              // Convert to world coordinates
              const ne = bounds.getNorthEast();
              const sw = bounds.getSouthWest();
              
              // Calculate lat/lng based on position
              const lat = ne.lat() - (y / rect.height) * (ne.lat() - sw.lat());
              const lng = sw.lng() + (x / rect.width) * (ne.lng() - sw.lng());
              
              // Show context menu at long-press location
              this.showContextMenu(lat, lng, {
                domEvent: {
                  clientX: touchStartCoords.x,
                  clientY: touchStartCoords.y
                }
              } as any);
            }
          }
        }, 500); // 500ms for long press
      }
    });
    
    mapDiv.addEventListener('touchmove', () => {
      // Cancel long-press if user moves finger
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = undefined;
        this.isLongPress = false;
      }
    });
    
    mapDiv.addEventListener('touchend', () => {
      // Clear long-press timer
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = undefined;
      }
    });
  }
  
  /**
   * Handles map click to fetch and display weather
   */
  private handleMapClick(lat: number, lng: number): void {
    // Round coordinates for consistency
    const roundedLat = Math.round(lat * 100) / 100;
    const roundedLng = Math.round(lng * 100) / 100;
    
    // Fetch weather data
    this.weatherService.getCurrentWeatherByCoordinates(roundedLat, roundedLng)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(weatherData => {
          // Fetch reverse geocoding
          return this.reverseGeocode(roundedLat, roundedLng).pipe(
            catchError(() => of('Unknown Location')),
            switchMap(locationName => {
              // Add to recent locations
              this.addRecentLocation(roundedLat, roundedLng, weatherData, locationName);
              
              // Import and open bottom sheet dynamically
              return from(import('./components/weather-details-bottom-sheet/weather-details-bottom-sheet.component')).pipe(
                switchMap(module => {
                  const ref = this.bottomSheet.open(module.WeatherDetailsBottomSheetComponent, {
                    data: {
                      weather: weatherData.current,
                      locationName: locationName,
                      latitude: roundedLat,
                      longitude: roundedLng
                    },
                    panelClass: 'weather-details-sheet',
                    hasBackdrop: true,
                    closeOnNavigation: true
                  });
                  
                  return ref.afterDismissed();
                })
              );
            })
          );
        }),
        catchError(error => {
          console.error('Error fetching weather:', error);
          this.snackBar.open('Unable to fetch weather data', 'Dismiss', {
            duration: 3000
          });
          return of(null);
        })
      )
      .subscribe();
  }
  
  /**
   * Reverse geocodes coordinates to get location name
   */
  private reverseGeocode(lat: number, lng: number): Observable<string> {
    // Check if we have a backend endpoint for geocoding
    const url = `${environment.apiUrl}/geocode/reverse`;
    
    return this.http.get<any>(url, {
      params: {
        lat: lat.toString(),
        lng: lng.toString()
      }
    }).pipe(
      switchMap(response => {
        if (response && response.locationName) {
          return of(response.locationName);
        }
        return of(`${lat.toFixed(2)}, ${lng.toFixed(2)}`);
      }),
      catchError(() => {
        // Fallback to coordinates if geocoding fails
        return of(`${lat.toFixed(2)}, ${lng.toFixed(2)}`);
      })
    );
  }
  
  /**
   * Adds a location to the recent locations cache
   */
  private addRecentLocation(lat: number, lng: number, weather: any, locationName: string): void {
    const key = `${lat.toFixed(2)}_${lng.toFixed(2)}`;
    
    this.recentLocations.update(map => {
      const newMap = new Map(map);
      
      // Remove oldest if we have 10 locations
      if (newMap.size >= 10) {
        const firstKey = newMap.keys().next().value;
        if (firstKey) {
          newMap.delete(firstKey);
        }
        // Also remove the marker
        const marker = this.recentLocationMarkers.shift();
        if (marker) {
          marker.setMap(null);
        }
      }
      
      // Add new location
      newMap.set(key, {
        lat,
        lng,
        weather,
        locationName,
        timestamp: Date.now()
      });
      
      return newMap;
    });
    
    // Add marker to map
    this.addRecentLocationMarker(lat, lng, locationName);
  }
  
  /**
   * Adds a marker for a recent location
   */
  private addRecentLocationMarker(lat: number, lng: number, title: string): void {
    if (!this.googleMap) return;
    
    const marker = new google.maps.Marker({
      position: { lat, lng },
      map: this.googleMap,
      title: title,
      icon: {
        url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
        scaledSize: new google.maps.Size(32, 32)
      },
      animation: google.maps.Animation.DROP
    });
    
    // Add click listener to marker
    marker.addListener('click', () => {
      this.handleMapClick(lat, lng);
    });
    
    this.recentLocationMarkers.push(marker);
  }
  
  /**
   * Shows context menu for mobile long-press
   */
  private showContextMenu(lat: number, lng: number, event?: google.maps.MapMouseEvent): void {
    // Close existing context menu if open
    if (this.contextMenuRef) {
      this.contextMenuRef.dispose();
    }
    
    // Create overlay position strategy
    const domEvent = event?.domEvent as MouseEvent | undefined;
    const positionStrategy = this.overlay.position()
      .flexibleConnectedTo({
        x: domEvent?.clientX || 0,
        y: domEvent?.clientY || 0
      } as any)
      .withPositions([
        {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top'
        },
        {
          originX: 'start',
          originY: 'top',
          overlayX: 'start',
          overlayY: 'bottom'
        }
      ]);
    
    // Create overlay
    this.contextMenuRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop'
    });
    
    // Create component portal
    const portal = new ComponentPortal(MapContextMenuComponent);
    const componentRef = this.contextMenuRef.attach(portal);
    
    // Set component inputs
    componentRef.instance.latitude = lat;
    componentRef.instance.longitude = lng;
    componentRef.instance.canAddLocation = this.locationService.locations().length < 5;
    
    // Handle action selection
    componentRef.instance.actionSelected.subscribe((action: string) => {
      this.handleContextMenuAction(action, lat, lng);
      this.contextMenuRef?.dispose();
      this.contextMenuRef = undefined;
    });
    
    // Close on backdrop click
    this.contextMenuRef.backdropClick().subscribe(() => {
      this.contextMenuRef?.dispose();
      this.contextMenuRef = undefined;
    });
  }
  
  /**
   * Handles context menu action selection
   */
  private handleContextMenuAction(action: string, lat: number, lng: number): void {
    switch (action) {
      case 'view-weather':
        this.handleMapClick(lat, lng);
        break;
      case 'add-location':
        this.addLocationToDashboard(lat, lng);
        break;
      case 'share':
        this.shareLocation(lat, lng);
        break;
      case 'directions':
        this.openDirections(lat, lng);
        break;
    }
  }
  
  /**
   * Adds location to dashboard from context menu
   */
  private addLocationToDashboard(lat: number, lng: number): void {
    // First get location name
    this.reverseGeocode(lat, lng).pipe(
      takeUntil(this.destroy$),
      switchMap(locationName => {
        // Create a new location with all required properties
        const newLocation = {
          id: `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: locationName,
          latitude: lat,
          longitude: lng,
          isPrimary: false,
          order: Date.now(),
          createdAt: new Date(),
          settings: {
            alertsEnabled: true,
            units: 'imperial' as const
          }
        };
        
        // Add location using LocationService
        return this.locationService.addLocation(newLocation).pipe(
          catchError((error: any) => {
            this.snackBar.open(error.message || 'Failed to add location', 'OK', { duration: 3000 });
            return of(null);
          })
        );
      })
    ).subscribe(result => {
      if (result) {
        this.snackBar.open('Location added to dashboard', 'OK', { duration: 3000 });
      }
    });
  }
  
  /**
   * Shares location coordinates
   */
  private shareLocation(lat: number, lng: number): void {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Weather Location',
        text: `Check weather at ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        url: url
      }).catch(() => {
        // Fallback to clipboard
        this.copyToClipboard(url);
      });
    } else {
      this.copyToClipboard(url);
    }
  }
  
  /**
   * Opens directions to location
   */
  private openDirections(lat: number, lng: number): void {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  }
  
  /**
   * Copies text to clipboard
   */
  private copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.snackBar.open('Location link copied to clipboard', 'OK', { duration: 3000 });
    }).catch(() => {
      this.snackBar.open('Failed to copy to clipboard', 'OK', { duration: 3000 });
    });
  }
  
  /**
   * Clears all recent location markers
   */
  private clearRecentLocationMarkers(): void {
    this.recentLocationMarkers.forEach(marker => {
      marker.setMap(null);
    });
    this.recentLocationMarkers = [];
  }
  
  ngOnDestroy(): void {
    // Clear recent location markers
    this.clearRecentLocationMarkers();
    
    // Clean up ResizeObserver
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    
    // Close context menu if open
    if (this.contextMenuRef) {
      this.contextMenuRef.dispose();
    }
    
    // Save session state
    this.weatherLayerService.saveToSession();
    
    // Clear all weather overlays
    this.removeAllWeatherOverlays();
    
    this.destroy$.next();
    this.destroy$.complete();
  }
}