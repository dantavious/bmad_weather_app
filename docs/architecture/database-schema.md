# Database Schema

## IndexedDB Schema (Frontend - Local Storage)

```javascript
// Frontend database schema
const DB_NAME = 'DatDudeWeatherDB';
const DB_VERSION = 1;

const schema = {
  locations: {
    keyPath: 'id',
    indexes: [
      { name: 'order', unique: false },
      { name: 'isPrimary', unique: false },
      { name: 'createdAt', unique: false }
    ]
  },
  weatherCache: {
    keyPath: 'cacheKey',
    indexes: [
      { name: 'locationId', unique: false },
      { name: 'timestamp', unique: false },
      { name: 'expiresAt', unique: false }
    ]
  },
  recentSearches: {
    keyPath: 'id',
    autoIncrement: true,
    indexes: [
      { name: 'searchedAt', unique: false }
    ]
  },
  settings: {
    keyPath: 'key'
  }
};
```

## File-Based Cache Schema (Backend - NestJS)

```typescript
// File structure for cache directory
/*
.cache/
├── weather/
│   ├── current/
│   │   └── {lat}_{lon}_{timestamp}.json
│   └── forecast/
│       └── {locationId}_{timestamp}.json
├── alerts/
│   └── {locationId}_{timestamp}.json
└── metadata.json
*/

interface CacheMetadata {
  version: string;
  lastCleanup: number;
  statistics: {
    hits: number;
    misses: number;
    totalCached: number;
    totalSize: number;
  };
}
```

## Cache Key Strategies

```typescript
export class CacheKeys {
  static currentWeather(lat: number, lon: number): string {
    const roundedLat = Math.round(lat * 100) / 100;
    const roundedLon = Math.round(lon * 100) / 100;
    return `weather:current:${roundedLat}_${roundedLon}`;
  }
  
  static forecast(locationId: string): string {
    return `weather:forecast:${locationId}`;
  }
  
  static readonly TTL = {
    CURRENT_WEATHER: 600,      // 10 minutes
    FORECAST: 3600,            // 1 hour
    ALERTS: 300,               // 5 minutes
    ACTIVITIES: 1800,          // 30 minutes
    MAP_TILES: 1800,          // 30 minutes
    SEARCH_RESULTS: 86400     // 24 hours
  };
}
```
