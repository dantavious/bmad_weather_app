# Data Models

## Weather Location Model

**Purpose:** Represents a saved weather location for a user

**Key Attributes:**
- id: string - Unique identifier (UUID)
- name: string - Display name (e.g., "Seattle, WA")
- latitude: number - Geographic latitude
- longitude: number - Geographic longitude
- isPrimary: boolean - Whether this is the user's primary location
- order: number - Display order in dashboard
- createdAt: Date - When location was added
- settings: LocationSettings - Per-location preferences

### TypeScript Interface
```typescript
// shared/models/location.model.ts
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

export interface LocationSettings {
  alertsEnabled: boolean;
  quietHoursStart?: string; // "22:00"
  quietHoursEnd?: string;   // "07:00"
  units: 'imperial' | 'metric';
}
```

**Relationships:**
- Has many WeatherData (current and forecast)
- Has many WeatherAlerts

## Weather Data Model

**Purpose:** Represents weather conditions at a specific time and location

**Key Attributes:**
- id: string - Unique identifier
- locationId: string - Reference to WeatherLocation
- timestamp: Date - When this data is for
- temperature: number - Current temperature
- feelsLike: number - Feels like temperature
- conditions: string - Weather description
- icon: string - Weather icon code
- humidity: number - Humidity percentage
- windSpeed: number - Wind speed
- windDirection: number - Wind direction in degrees
- precipitation: number - Precipitation amount
- cloudCover: number - Cloud coverage percentage

### TypeScript Interface
```typescript
// shared/models/weather.model.ts
export interface WeatherData {
  id: string;
  locationId: string;
  timestamp: Date;
  temperature: number;
  feelsLike: number;
  conditions: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  precipitation: number;
  cloudCover: number;
  pressure: number;
  uvIndex: number;
  visibility: number;
}

export interface WeatherForecast extends WeatherData {
  tempMin: number;
  tempMax: number;
  precipitationChance: number;
}
```

**Relationships:**
- Belongs to WeatherLocation
- May have ActivityRecommendations

## Weather Alert Model

**Purpose:** Represents severe weather alerts from NWS

**Key Attributes:**
- id: string - Unique identifier
- locationId: string - Reference to WeatherLocation
- alertType: AlertSeverity - Warning/Watch/Advisory
- headline: string - Alert headline
- description: string - Full alert text
- startTime: Date - When alert begins
- endTime: Date - When alert expires
- source: string - "NWS" or other source

### TypeScript Interface
```typescript
// shared/models/alert.model.ts
export enum AlertSeverity {
  WARNING = 'warning',
  WATCH = 'watch',
  ADVISORY = 'advisory'
}

export interface WeatherAlert {
  id: string;
  locationId: string;
  alertType: AlertSeverity;
  headline: string;
  description: string;
  startTime: Date;
  endTime: Date;
  source: string;
  isActive: boolean;
}
```

**Relationships:**
- Belongs to WeatherLocation

## Activity Recommendation Model

**Purpose:** Represents activity suitability based on weather conditions

**Key Attributes:**
- activityType: ActivityType - Type of activity
- rating: Rating - Good/Fair/Poor
- score: number - Numeric score (0-100)
- bestHours: string[] - Optimal times today
- factors: object - Why this rating

### TypeScript Interface
```typescript
// shared/models/activity.model.ts
export enum ActivityType {
  RUNNING = 'running',
  CYCLING = 'cycling',
  GARDENING = 'gardening',
  OUTDOOR_WORK = 'outdoor_work',
  STARGAZING = 'stargazing'
}

export enum Rating {
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor'
}

export interface ActivityRecommendation {
  activityType: ActivityType;
  rating: Rating;
  score: number;
  bestHours: string[]; // ["06:00", "07:00", "18:00"]
  factors: {
    temperature: Rating;
    wind: Rating;
    precipitation: Rating;
    humidity: Rating;
    [key: string]: Rating;
  };
}
```

**Relationships:**
- Calculated from WeatherData
