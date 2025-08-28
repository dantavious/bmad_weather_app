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