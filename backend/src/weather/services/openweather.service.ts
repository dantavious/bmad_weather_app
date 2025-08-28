import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';
import { Weather } from '../../../../shared/models/weather.model';

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

  async fetchCurrentWeather(latitude: number, longitude: number): Promise<Weather> {
    try {
      const url = `${this.baseUrl}/weather`;
      const response = await axios.get(url, {
        params: {
          lat: latitude,
          lon: longitude,
          appid: this.apiKey,
          units: 'imperial',
        },
      });

      return this.mapResponseToWeather(response.data);
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