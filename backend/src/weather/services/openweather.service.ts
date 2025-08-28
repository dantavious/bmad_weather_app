import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';
import { Weather, DailyWeather } from '../../../../shared/models/weather.model';

@Injectable()
export class OpenWeatherService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.openweathermap.org/data/2.5';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('openweather.apiKey', '');
    if (!this.apiKey) {
      throw new Error('OPENWEATHER_API_KEY is required');
    }
  }

  async fetchCurrentWeather(
    latitude: number,
    longitude: number,
    units: 'imperial' | 'metric' = 'imperial',
  ): Promise<Weather> {
    try {
      const url = `${this.baseUrl}/weather`;
      const response = await axios.get(url, {
        params: {
          lat: latitude,
          lon: longitude,
          appid: this.apiKey,
          units: units,
        },
      });

      return this.mapResponseToWeather(response.data);
    } catch (error) {
      this.handleApiError(error);
    }
  }

  async fetchForecast(
    latitude: number,
    longitude: number,
    units: 'imperial' | 'metric' = 'imperial',
  ): Promise<DailyWeather[]> {
    try {
      const url = `${this.baseUrl}/forecast`;
      const response = await axios.get(url, {
        params: {
          lat: latitude,
          lon: longitude,
          appid: this.apiKey,
          units: units,
          cnt: 40, // Get 5 days of 3-hour intervals
        },
      });

      return this.processForecastData(response.data, units);
    } catch (error) {
      this.handleApiError(error);
    }
  }

  private mapResponseToWeather(data: any): Weather {
    return {
      timestamp: new Date(),
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      windSpeed: Math.round(data.wind.speed),
      windDirection: data.wind.deg,
      cloudiness: data.clouds.all,
      visibility: data.visibility,
      description: data.weather[0]?.description || '',
      icon: data.weather[0]?.icon || '',
    };
  }

  private processForecastData(data: any, units: string): DailyWeather[] {
    const dailyMap = new Map<string, any[]>();
    
    // Group forecast items by day
    data.list.forEach((item: any) => {
      const date = new Date(item.dt * 1000);
      const dayKey = date.toISOString().split('T')[0];
      
      if (!dailyMap.has(dayKey)) {
        dailyMap.set(dayKey, []);
      }
      dailyMap.get(dayKey)?.push(item);
    });

    // Convert to daily forecasts
    const dailyForecasts: DailyWeather[] = [];
    
    dailyMap.forEach((dayData, dateString) => {
      if (dailyForecasts.length >= 7) return; // Limit to 7 days
      
      const temps = dayData.map(item => item.main.temp);
      const minTemp = Math.min(...temps);
      const maxTemp = Math.max(...temps);
      
      // Get the most common weather condition for the day
      const conditions = dayData.map(item => ({
        description: item.weather[0]?.description || '',
        icon: item.weather[0]?.icon || '',
      }));
      
      // Use the weather at noon (or closest to it) as representative
      const noonIndex = Math.floor(dayData.length / 2);
      const representativeWeather = conditions[noonIndex] || conditions[0];
      
      // Calculate average humidity and wind speed
      const avgHumidity = Math.round(
        dayData.reduce((sum, item) => sum + item.main.humidity, 0) / dayData.length
      );
      const avgWindSpeed = Math.round(
        dayData.reduce((sum, item) => sum + item.wind.speed, 0) / dayData.length
      );
      
      // Calculate precipitation probability (use max for the day)
      const precipProbability = Math.round(
        Math.max(...dayData.map(item => (item.pop || 0) * 100))
      );
      
      dailyForecasts.push({
        date: new Date(dateString),
        temperatureMin: Math.round(minTemp),
        temperatureMax: Math.round(maxTemp),
        humidity: avgHumidity,
        windSpeed: avgWindSpeed,
        description: representativeWeather.description,
        icon: representativeWeather.icon,
        precipitationProbability: precipProbability,
      });
    });
    
    return dailyForecasts.slice(0, 7); // Ensure we return exactly 7 days or less
  }

  private handleApiError(error: any): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      if (axiosError.response) {
        const status = axiosError.response.status;

        switch (status) {
          case 401:
            throw new HttpException(
              'Invalid or missing OpenWeather API key',
              HttpStatus.UNAUTHORIZED,
            );
          case 404:
            throw new HttpException(
              'Weather data not found for the given coordinates',
              HttpStatus.NOT_FOUND,
            );
          case 429:
            throw new HttpException(
              'OpenWeather API rate limit exceeded',
              HttpStatus.TOO_MANY_REQUESTS,
            );
          default:
            throw new HttpException(
              'OpenWeather API error',
              HttpStatus.SERVICE_UNAVAILABLE,
            );
        }
      }

      throw new HttpException(
        'Failed to fetch weather data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    throw new HttpException(
      'Failed to fetch weather data',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
