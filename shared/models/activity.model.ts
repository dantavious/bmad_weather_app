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

export interface WeatherFactors {
  temperature: Rating;
  wind: Rating;
  precipitation: Rating;
  humidity: Rating;
  aqi?: Rating;
}

export interface ActivityRecommendation {
  activityType: ActivityType;
  rating: Rating;
  score: number;
  bestHours: string[];
  factors: WeatherFactors;
}

export interface ActivityThresholds {
  temperature?: {
    min: number;
    max: number;
    optimal: number;
  };
  wind?: {
    max: number;
  };
  precipitation?: {
    max: number;
  };
  humidity?: {
    min: number;
    max: number;
  };
  aqi?: {
    max: number;
  };
}

export interface ActivitySettings {
  showActivities: boolean;
  enabledActivities: ActivityType[];
  showBestHours: boolean;
  customThresholds?: Partial<Record<ActivityType, ActivityThresholds>>;
}

export interface LocationSettings {
  alertsEnabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  units: 'imperial' | 'metric';
  activitySettings?: ActivitySettings;
}