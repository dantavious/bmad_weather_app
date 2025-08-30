import { Test, TestingModule } from '@nestjs/testing';
import { WeatherController } from './weather.controller';
import { OpenWeatherService } from '../services/openweather.service';
import { CacheService } from '../services/cache.service';
import { RateLimitGuard } from '../guards/rate-limit.guard';
import { WeatherQueryDto } from '../dto/weather-query.dto';
import { Weather } from '../../../../shared/models/weather.model';
import { ConfigService } from '@nestjs/config';

describe('WeatherController', () => {
  let controller: WeatherController;
  let openWeatherService: OpenWeatherService;
  let cacheService: CacheService;

  const mockWeather: Weather = {
    timestamp: new Date(),
    temperature: 72,
    feelsLike: 70,
    humidity: 65,
    pressure: 1013,
    windSpeed: 5,
    windDirection: 180,
    cloudiness: 0,
    visibility: 10000,
    description: 'Clear',
    icon: '01d',
  };

  const mockOpenWeatherService = {
    fetchCurrentWeather: jest.fn(),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue(60),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WeatherController],
      providers: [
        {
          provide: OpenWeatherService,
          useValue: mockOpenWeatherService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: RateLimitGuard,
          useValue: { canActivate: jest.fn(() => true) },
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<WeatherController>(WeatherController);
    openWeatherService = module.get<OpenWeatherService>(OpenWeatherService);
    cacheService = module.get<CacheService>(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentWeather', () => {
    const dto: WeatherQueryDto = {
      latitude: 47.6,
      longitude: -122.3,
    };

    it('should return cached weather data when available', async () => {
      mockCacheService.get.mockResolvedValue(mockWeather);

      const result = await controller.getCurrentWeather(dto);

      expect(result).toEqual(mockWeather);
      expect(cacheService.get).toHaveBeenCalledWith(
        'weather:current:47.6:-122.3',
      );
      expect(openWeatherService.fetchCurrentWeather).not.toHaveBeenCalled();
      expect(cacheService.set).not.toHaveBeenCalled();
    });

    it('should fetch from API when cache miss', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockOpenWeatherService.fetchCurrentWeather.mockResolvedValue(mockWeather);

      const result = await controller.getCurrentWeather(dto);

      expect(result).toEqual(mockWeather);
      expect(cacheService.get).toHaveBeenCalledWith(
        'weather:current:47.6:-122.3',
      );
      expect(openWeatherService.fetchCurrentWeather).toHaveBeenCalledWith(
        47.6,
        -122.3,
        'imperial',
      );
      expect(cacheService.set).toHaveBeenCalledWith(
        'weather:current:47.6:-122.3',
        mockWeather,
      );
    });

    it('should handle coordinates with decimal precision', async () => {
      const preciseDto: WeatherQueryDto = {
        latitude: 47.6062,
        longitude: -122.3321,
      };

      mockCacheService.get.mockResolvedValue(null);
      mockOpenWeatherService.fetchCurrentWeather.mockResolvedValue(mockWeather);

      await controller.getCurrentWeather(preciseDto);

      expect(cacheService.get).toHaveBeenCalledWith(
        'weather:current:47.61:-122.33',
      );
    });
  });
});
