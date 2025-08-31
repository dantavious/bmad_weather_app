import { Test, TestingModule } from '@nestjs/testing';
import { SolarService } from './solar.service';
import { CacheService } from '../cache/cache.service';
import { SolarIrradianceDto } from './dto/solar-calculation.dto';

describe('SolarService', () => {
  let service: SolarService;
  let cacheService: jest.Mocked<CacheService>;

  beforeEach(async () => {
    const mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SolarService,
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<SolarService>(SolarService);
    cacheService = module.get(CacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSolarIrradiance', () => {
    const dto: SolarIrradianceDto = {
      latitude: 40.7128,
      longitude: -74.0060,
    };

    it('should return cached data if available', async () => {
      const cachedData = {
        latitude: 40.71,
        longitude: -74.01,
        date: new Date(),
        hourlyIrradiance: Array(24).fill(0),
        sunriseHour: 6.5,
        sunsetHour: 18.5,
      };

      cacheService.get.mockResolvedValue(cachedData);

      const result = await service.getSolarIrradiance(dto);

      expect(result).toEqual(cachedData);
      expect(cacheService.get).toHaveBeenCalledWith(
        expect.stringContaining('solar:irradiance:40.71:-74.01')
      );
      expect(cacheService.set).not.toHaveBeenCalled();
    });

    it('should calculate and cache data if not in cache', async () => {
      cacheService.get.mockResolvedValue(null);
      cacheService.set.mockResolvedValue(undefined);

      const result = await service.getSolarIrradiance(dto);

      expect(result).toBeDefined();
      expect(result.latitude).toBe(40.71);
      expect(result.longitude).toBe(-74.01);
      expect(result.hourlyIrradiance).toHaveLength(24);
      expect(result.sunriseHour).toBeDefined();
      expect(result.sunsetHour).toBeDefined();

      expect(cacheService.set).toHaveBeenCalledWith(
        expect.stringContaining('solar:irradiance:40.71:-74.01'),
        expect.objectContaining({
          latitude: 40.71,
          longitude: -74.01,
        }),
        3600
      );
    });

    it('should round coordinates for consistent caching', async () => {
      const dto1: SolarIrradianceDto = {
        latitude: 40.71284,
        longitude: -74.00599,
      };

      const dto2: SolarIrradianceDto = {
        latitude: 40.71289,
        longitude: -74.00601,
      };

      cacheService.get.mockResolvedValue(null);

      await service.getSolarIrradiance(dto1);
      await service.getSolarIrradiance(dto2);

      // Both should use the same cache key (rounded to 40.71, -74.01)
      expect(cacheService.set).toHaveBeenCalledTimes(2);
      const calls = cacheService.set.mock.calls;
      expect(calls[0][0]).toContain('40.71:-74.01');
      expect(calls[1][0]).toContain('40.71:-74.01');
    });

    it('should calculate reasonable sunrise/sunset times', async () => {
      cacheService.get.mockResolvedValue(null);

      // Test New York (40.7128°N)
      const nyResult = await service.getSolarIrradiance({
        latitude: 40.7128,
        longitude: -74.0060,
      });

      expect(nyResult.sunriseHour).toBeGreaterThan(0);
      expect(nyResult.sunriseHour).toBeLessThan(12);
      expect(nyResult.sunsetHour).toBeGreaterThan(12);
      expect(nyResult.sunsetHour).toBeLessThan(24);

      // Test equator
      const equatorResult = await service.getSolarIrradiance({
        latitude: 0,
        longitude: 0,
      });

      expect(equatorResult.sunriseHour).toBeCloseTo(6, 1);
      expect(equatorResult.sunsetHour).toBeCloseTo(18, 1);
    });

    it('should generate valid irradiance values', async () => {
      cacheService.get.mockResolvedValue(null);

      const result = await service.getSolarIrradiance(dto);

      // Check all values are non-negative
      result.hourlyIrradiance.forEach(value => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1000); // Max theoretical irradiance
      });

      // Check nighttime hours have zero irradiance
      const sunriseHour = Math.floor(result.sunriseHour);
      const sunsetHour = Math.ceil(result.sunsetHour);

      for (let i = 0; i < sunriseHour; i++) {
        expect(result.hourlyIrradiance[i]).toBe(0);
      }

      for (let i = sunsetHour + 1; i < 24; i++) {
        expect(result.hourlyIrradiance[i]).toBe(0);
      }

      // Check that daytime has some irradiance
      const daytimeIrradiance = result.hourlyIrradiance.slice(sunriseHour, sunsetHour + 1);
      const maxDaytime = Math.max(...daytimeIrradiance);
      expect(maxDaytime).toBeGreaterThan(0);
    });

    it('should handle polar regions correctly', async () => {
      cacheService.get.mockResolvedValue(null);

      // Test Arctic Circle in summer (should have long days)
      const arcticSummer = await service.getSolarIrradiance({
        latitude: 70,
        longitude: 0,
      });

      const dayLength = arcticSummer.sunsetHour - arcticSummer.sunriseHour;
      expect(dayLength).toBeGreaterThan(12); // Long day

      // Test Antarctica (should have different day length)
      const antarctica = await service.getSolarIrradiance({
        latitude: -70,
        longitude: 0,
      });

      expect(antarctica.sunriseHour).toBeDefined();
      expect(antarctica.sunsetHour).toBeDefined();
    });
  });
});