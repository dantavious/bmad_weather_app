/// <reference types="@types/google.maps" />
import { Injectable } from '@angular/core';
import { Observable, ReplaySubject, from } from 'rxjs';
import { environment } from '../../../environments/environment';

declare global {
  interface Window {
    google: typeof google;
    initMap?: () => void;
  }
}

@Injectable({
  providedIn: 'root'
})
export class GoogleMapsService {
  private loadingSubject = new ReplaySubject<boolean>(1);
  private loadedSubject = new ReplaySubject<typeof google>(1);
  private errorSubject = new ReplaySubject<Error>(1);
  
  loading$ = this.loadingSubject.asObservable();
  loaded$ = this.loadedSubject.asObservable();
  error$ = this.errorSubject.asObservable();
  
  private scriptLoaded = false;
  private scriptLoading = false;
  
  constructor() {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      this.scriptLoaded = true;
      this.loadedSubject.next(window.google);
      this.loadingSubject.next(false);
    }
  }
  
  loadGoogleMaps(): Observable<typeof google> {
    // Return existing if already loaded
    if (this.scriptLoaded) {
      return this.loaded$;
    }
    
    // Return loading observable if already loading
    if (this.scriptLoading) {
      return this.loaded$;
    }
    
    this.scriptLoading = true;
    this.loadingSubject.next(true);
    
    // Create script element with async loading pattern
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&libraries=places&loading=async&callback=initMap`;
    script.async = true;
    script.defer = true;
    
    // Setup callback
    window.initMap = () => {
      this.scriptLoaded = true;
      this.scriptLoading = false;
      this.loadingSubject.next(false);
      this.loadedSubject.next(window.google);
      delete window.initMap;
    };
    
    // Handle errors
    script.onerror = (error) => {
      this.scriptLoading = false;
      this.loadingSubject.next(false);
      const err = new Error('Failed to load Google Maps API. Please check API key restrictions.');
      this.errorSubject.next(err);
      console.error('Google Maps loading error:', error);
      console.error('API key restrictions may be blocking the request. Check: https://developers.google.com/maps/documentation/javascript/error-messages#api-target-blocked-map-error');
    };
    
    // Add script to document
    document.head.appendChild(script);
    
    return this.loaded$;
  }
  
  createMap(element: HTMLElement, options?: google.maps.MapOptions): google.maps.Map {
    if (!window.google || !window.google.maps) {
      throw new Error('Google Maps not loaded');
    }
    
    const defaultOptions: google.maps.MapOptions = {
      zoom: 10,
      center: { lat: 40.7128, lng: -74.0060 }, // Default to NYC
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      ...options
    };
    
    return new window.google.maps.Map(element, defaultOptions);
  }
  
  getUserLocation(): Observable<GeolocationPosition> {
    return from(new Promise<GeolocationPosition>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        position => resolve(position),
        error => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    }));
  }
}