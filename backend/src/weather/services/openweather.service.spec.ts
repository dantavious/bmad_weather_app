import { Test, TestingModule } from '@nestjs/testing';
import { OpenWeatherService } from './openweather.service';
import { ConfigService } from '@nestjs/config';
import { HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('OpenWeatherService', () => {
  let service: OpenWeatherService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'openweather.apiKey') return 'test-api-key';
      return undefined;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenWeatherService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<OpenWeatherService>(OpenWeatherService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchForecast', () => {
    it('should fetch and process 7-day forecast', async () => {
      const mockForecastResponse = {
        data: {
          list: [
            // Day 1 - multiple entries
            {
              dt: 1704067200,
              main: { temp: 50, humidity: 65 },
              weather: [{ description: 'clear sky', icon: '01d' }],
              wind: { speed: 10 },
              pop: 0.1,
            },
            {
              dt: 1704078000,
              main: { temp: 55, humidity: 60 },
              weather: [{ description: 'clear sky', icon: '01d' }],
              wind: { speed: 12 },
              pop: 0.15,
            },
            {
              dt: 1704088800,
              main: { temp: 60, humidity: 55 },
              weather: [{ description: 'few clouds', icon: '02d' }],
              wind: { speed: 8 },
              pop: 0.2,
            },
            // Day 2 - multiple entries
            {
              dt: 1704153600,
              main: { temp: 45, humidity: 70 },
              weather: [{ description: 'light rain', icon: '10d' }],
              wind: { speed: 15 },
              pop: 0.6,
            },
            {
              dt: 1704164400,
              main: { temp: 48, humidity: 75 },
              weather: [{ description: 'rain', icon: '10d' }],
              wind: { speed: 18 },
              pop: 0.8,
            },
          ],
        },
      };

      mockedAxios.get.mockResolvedValue(mockForecastResponse);

      const result = await service.fetchForecast(40.7128, -74.006, 'imperial');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.openweathermap.org/data/2.5/forecast',
        {
          params: {
            lat: 40.7128,
            lon: -74.006,
            appid: 'test-api-key',
            units: 'imperial',
            cnt: 40,
          },
        },
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        temperatureMin: 50,
        temperatureMax: 60,
        humidity: 60,
        windSpeed: 10,
        precipitationProbability: 20,
      });
    });

    it('should limit forecast to 7 days', async () => {
      const mockForecastResponse = {
        data: {
          list: Array(40)
            .fill(null)
            .map((_, index) => ({
              dt: 1704067200 + index * 10800, // 3-hour intervals
              main: { temp: 50 + index, humidity: 60 },
              weather: [{ description: 'clear', icon: '01d' }],
              wind: { speed: 10 },
              pop: 0.1,
            })),
        },
      };

      mockedAxios.get.mockResolvedValue(mockForecastResponse);

      const result = await service.fetchForecast(40.7128, -74.006);

      expect(result.length).toBeLessThanOrEqual(7);
    });

    it('should calculate precipitation probability correctly', async () => {
      const mockForecastResponse = {
        data: {
          list: [
            {
              dt: 1704067200,
              main: { temp: 50, humidity: 65 },
              weather: [{ description: 'rain', icon: '10d' }],
              wind: { speed: 10 },
              pop: 0.0,
            },
            {
              dt: 1704078000,
              main: { temp: 52, humidity: 70 },
              weather: [{ description: 'rain', icon: '10d' }],
              wind: { speed: 12 },
              pop: 0.95,
            },
          ],
        },
      };

      mockedAxios.get.mockResolvedValue(mockForecastResponse);

      const result = await service.fetchForecast(40.7128, -74.006);

      expect(result[0].precipitationProbability).toBe(95);
    });

    it('should handle API errors for forecast', async () => {
      const error = {
        isAxiosError: true,
        response: { status: 429 },
      };
      mockedAxios.get.mockRejectedValue(error);
      mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

      await expect(service.fetchForecast(40.7128, -74.006)).rejects.toThrow(
        new HttpException(
          'OpenWeather API rate limit exceeded',
          HttpStatus.TOO_MANY_REQUESTS,
        ),
      );
    });
  });

  describe('fetchCurrentWeather', () => {
    const mockApiResponse = {
      data: {
        main: {
          temp: 72.5,
          feels_like: 70.2,
          humidity: 65,
          pressure: 1013,
        },
        wind: {
          speed: 5.2,
          deg: 180,
        },
        clouds: {
          all: 0,
        },
        visibility: 10000,
        weather: [
          {
            description: 'Clear sky',
            icon: '01d',
          },
        ],
      },
    };

    it('should return weather data for valid coordinates', async () => {
      mockedAxios.get.mockResolvedValue(mockApiResponse);

      const result = await service.fetchCurrentWeather(47.6, -122.3);

      expect(result).toMatchObject({
        temperature: 73,
        feelsLike: 70,
        humidity: 65,
        pressure: 1013,
        windSpeed: 5,
        windDirection: 180,
        cloudiness: 0,
        visibility: 10000,
        description: 'Clear sky',
        icon: '01d',
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.openweathermap.org/data/2.5/weather',
        {
          params: {
            lat: 47.6,
            lon: -122.3,
            appid: 'test-api-key',
            units: 'imperial',
          },
        },
      );
    });

    it('should handle 401 unauthorized error', async () => {
      const error = {
        isAxiosError: true,
        response: { status: 401 },
      };
      mockedAxios.get.mockRejectedValue(error);
      mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

      await expect(service.fetchCurrentWeather(47.6, -122.3)).rejects.toThrow(
        new HttpException(
          'Invalid or missing OpenWeather API key',
          HttpStatus.UNAUTHORIZED,
        ),
      );
    });

    it('should handle 404 not found error', async () => {
      const error = {
        isAxiosError: true,
        response: { status: 404 },
      };
      mockedAxios.get.mockRejectedValue(error);
      mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

      await expect(service.fetchCurrentWeather(47.6, -122.3)).rejects.toThrow(
        new HttpException(
          'Weather data not found for the given coordinates',
          HttpStatus.NOT_FOUND,
        ),
      );
    });

    it('should handle 429 rate limit error', async () => {
      const error = {
        isAxiosError: true,
        response: { status: 429 },
      };
      mockedAxios.get.mockRejectedValue(error);
      mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

      await expect(service.fetchCurrentWeather(47.6, -122.3)).rejects.toThrow(
        new HttpException(
          'OpenWeather API rate limit exceeded',
          HttpStatus.TOO_MANY_REQUESTS,
        ),
      );
    });

    it('should handle generic API error', async () => {
      const error = {
        isAxiosError: true,
        response: { status: 503 },
      };
      mockedAxios.get.mockRejectedValue(error);
      mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

      await expect(service.fetchCurrentWeather(47.6, -122.3)).rejects.toThrow(
        new HttpException(
          'OpenWeather API error',
          HttpStatus.SERVICE_UNAVAILABLE,
        ),
      );
    });

    it('should handle network error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));
      mockedAxios.isAxiosError = jest.fn().mockReturnValue(false);

      await expect(service.fetchCurrentWeather(47.6, -122.3)).rejects.toThrow(
        new HttpException(
          'Failed to fetch weather data',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });

    it('should handle missing weather description', async () => {
      const responseWithoutWeather = {
        ...mockApiResponse,
        data: {
          ...mockApiResponse.data,
          weather: [],
        },
      };
      mockedAxios.get.mockResolvedValue(responseWithoutWeather);

      const result = await service.fetchCurrentWeather(47.6, -122.3);

      expect(result.description).toBe('');
      expect(result.icon).toBe('');
    });
  });
});
