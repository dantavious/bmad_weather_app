import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { PrecipitationMonitorService } from './precipitation-monitor.service';
import { CacheService } from '../weather/services/cache.service';

describe('PrecipitationMonitorService', () => {
  let service: PrecipitationMonitorService;
  let httpService: HttpService;
  let configService: ConfigService;
  let cacheService: CacheService;

  const mockMinutelyData = {
    minutely: [
      { dt: Date.now() / 1000, precipitation: 0 },
      { dt: Date.now() / 1000 + 60, precipitation: 0 },
      { dt: Date.now() / 1000 + 120, precipitation: 0.2 }, // Rain starts at minute 3
      { dt: Date.now() / 1000 + 180, precipitation: 0.5 },
      { dt: Date.now() / 1000 + 240, precipitation: 0.8 },
      { dt: Date.now() / 1000 + 300, precipitation: 0.6 },
      { dt: Date.now() / 1000 + 360, precipitation: 0.3 },
      { dt: Date.now() / 1000 + 420, precipitation: 0.1 },
      { dt: Date.now() / 1000 + 480, precipitation: 0 },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrecipitationMonitorService,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'openweather.apiKey') return 'test-api-key';
              return undefined;
            }),
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PrecipitationMonitorService>(
      PrecipitationMonitorService,
    );
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);
    cacheService = module.get<CacheService>(CacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkPrecipitation', () => {
    it('should detect upcoming precipitation', async () => {
      jest.spyOn(cacheService, 'get').mockResolvedValue(null);
      jest.spyOn(cacheService, 'set').mockResolvedValue(undefined);
      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(of({ data: mockMinutelyData } as any));

      const result = await service.checkPrecipitation(
        40.7128,
        -74.006,
        'test-location',
      );

      expect(result).toBeDefined();
      expect(result?.minutesToStart).toBe(3);
      expect(result?.precipitationType).toBe('rain');
      expect(result?.intensity).toBeDefined();
    });

    it('should return null when no precipitation in next 15 minutes', async () => {
      const noPrecipData = {
        minutely: Array(15)
          .fill(null)
          .map((_, i) => ({
            dt: Date.now() / 1000 + i * 60,
            precipitation: 0,
          })),
      };

      jest.spyOn(cacheService, 'get').mockResolvedValue(null);
      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(of({ data: noPrecipData } as any));

      const result = await service.checkPrecipitation(
        40.7128,
        -74.006,
        'test-location',
      );

      expect(result).toBeNull();
    });

    it('should use cached data when available', async () => {
      const cachedAlert = {
        locationId: 'test-location',
        lat: 40.71,
        lon: -74.01,
        minutesToStart: 5,
        precipitationType: 'rain',
        intensity: 'light',
        estimatedDuration: 30,
        timestamp: new Date(),
      };

      jest.spyOn(cacheService, 'get').mockResolvedValue(cachedAlert);
      const httpSpy = jest.spyOn(httpService, 'get');

      const result = await service.checkPrecipitation(
        40.7128,
        -74.006,
        'test-location',
      );

      expect(result).toEqual(cachedAlert);
      expect(httpSpy).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      jest.spyOn(cacheService, 'get').mockResolvedValue(null);
      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(throwError(() => new Error('API Error')));

      const result = await service.checkPrecipitation(
        40.7128,
        -74.006,
        'test-location',
      );

      expect(result).toBeNull();
    });
  });

  describe('cooldown management', () => {
    it('should enforce cooldown period', async () => {
      jest.spyOn(cacheService, 'get').mockResolvedValue(null);
      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(of({ data: mockMinutelyData } as any));

      // First call should succeed
      const result1 = await service.checkPrecipitation(
        40.7128,
        -74.006,
        'test-location',
      );
      expect(result1).toBeDefined();

      // Second call within cooldown should return null
      const result2 = await service.checkPrecipitation(
        40.7128,
        -74.006,
        'test-location',
      );
      expect(result2).toBeNull();
    });

    it('should clear cooldown when requested', async () => {
      jest.spyOn(cacheService, 'get').mockResolvedValue(null);
      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(of({ data: mockMinutelyData } as any));

      // First call
      await service.checkPrecipitation(40.7128, -74.006, 'test-location');

      // Clear cooldown
      service.clearCooldown('test-location');

      // Should be able to get alert again
      const result = await service.checkPrecipitation(
        40.7128,
        -74.006,
        'test-location',
      );
      expect(result).toBeDefined();
    });

    it('should return correct cooldown status', async () => {
      // No cooldown initially
      let status = service.getCooldownStatus('test-location');
      expect(status.inCooldown).toBe(false);

      // Set cooldown by checking precipitation
      jest.spyOn(cacheService, 'get').mockResolvedValue(null);
      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(of({ data: mockMinutelyData } as any));

      await service.checkPrecipitation(40.7128, -74.006, 'test-location');

      // Should be in cooldown
      status = service.getCooldownStatus('test-location');
      expect(status.inCooldown).toBe(true);
      expect(status.remainingMinutes).toBeDefined();
      expect(status.remainingMinutes).toBeGreaterThan(0);
      expect(status.remainingMinutes).toBeLessThanOrEqual(30);
    });
  });

  describe('checkMultipleLocations', () => {
    it('should check multiple locations in parallel', async () => {
      const locations = [
        { id: 'loc1', lat: 40.7128, lon: -74.006 },
        { id: 'loc2', lat: 41.8781, lon: -87.6298 },
        { id: 'loc3', lat: 34.0522, lon: -118.2437 },
      ];

      jest.spyOn(cacheService, 'get').mockResolvedValue(null);
      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(of({ data: mockMinutelyData } as any));

      const results = await service.checkMultipleLocations(locations);

      expect(results).toHaveLength(3);
      expect(results[0].locationId).toBe('loc1');
      expect(results[1].locationId).toBe('loc2');
      expect(results[2].locationId).toBe('loc3');
    });

    it('should filter out null results', async () => {
      const locations = [
        { id: 'loc1', lat: 40.7128, lon: -74.006 },
        { id: 'loc2', lat: 41.8781, lon: -87.6298 },
      ];

      const noPrecipData = {
        minutely: Array(15)
          .fill(null)
          .map((_, i) => ({
            dt: Date.now() / 1000 + i * 60,
            precipitation: 0,
          })),
      };

      jest.spyOn(cacheService, 'get').mockResolvedValue(null);
      jest
        .spyOn(httpService, 'get')
        .mockReturnValueOnce(of({ data: mockMinutelyData } as any))
        .mockReturnValueOnce(of({ data: noPrecipData } as any));

      const results = await service.checkMultipleLocations(locations);

      expect(results).toHaveLength(1);
      expect(results[0].locationId).toBe('loc1');
    });
  });
});
