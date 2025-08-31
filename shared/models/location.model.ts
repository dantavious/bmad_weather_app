export interface LocationSettings {
  alertsEnabled: boolean;
  quietHoursStart?: string; // "22:00"
  quietHoursEnd?: string;   // "07:00"
  units: 'imperial' | 'metric';
}

export interface WeatherLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  isPrimary: boolean;
  order: number;
  createdAt: Date;
  settings: LocationSettings;
}

export interface LocationSearchResult {
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
}

// Simplified Location interface for components that don't need full WeatherLocation
export interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  isCurrentLocation?: boolean;
  order: number;
}
