export interface Weather {
  timestamp: Date;
  temperature: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  cloudiness: number;
  visibility: number;
  description: string;
  icon: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
}

export interface WeatherForecast {
  location: Location;
  current: Weather;
  hourly?: Weather[];
  daily?: DailyWeather[];
}

export interface DailyWeather {
  date: Date;
  temperatureMin: number;
  temperatureMax: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
  precipitationProbability: number;
}

export interface WeatherAlert {
  id: string;
  event: string;
  severity: 'minor' | 'moderate' | 'severe' | 'extreme';
  start: Date;
  end: Date;
  description: string;
  instructions?: string;
}