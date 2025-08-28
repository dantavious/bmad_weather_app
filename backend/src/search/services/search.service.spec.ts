import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { AxiosResponse, AxiosError } from 'axios';
import { SearchService } from './search.service';
import { CacheService } from '../../weather/services/cache.service';

// Mock the CacheKeys util
jest.mock('@shared/utils/cache-keys.util', () => ({
  CacheKeys: {
    locationSearch: jest.fn(
      (query: string) => `location:search:${query.toLowerCase().trim()}`,
    ),
  },
}));

describe('SearchService', () => {
  let service: SearchService;
  let httpService: HttpService;
  let cacheService: CacheService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-api-key'),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const mockHttpService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: HttpService, useValue: mockHttpService },
        { provide: CacheService, useValue: mockCacheService },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    httpService = module.get<HttpService>(HttpService);
    cacheService = module.get<CacheService>(CacheService);
    configService = module.get<ConfigService>(ConfigService);

    // Clear mocks
    jest.clearAllMocks();
  });

  describe('searchLocation', () => {
    it('should return cached results if available', async () => {
      const cachedResults = [
        {
          name: 'New York',
          country: 'US',
          state: 'NY',
          lat: 40.71,
          lon: -74.01,
        },
      ];
      mockCacheService.get.mockReturnValue(cachedResults);

      const result = await service.searchLocation('New York');

      expect(result).toEqual(cachedResults);
      expect(mockCacheService.get).toHaveBeenCalledWith(
        'location:search:new york',
      );
      expect(mockHttpService.get).not.toHaveBeenCalled();
    });

    it('should search by city name', async () => {
      const mockResponse: AxiosResponse = {
        data: [
          { name: 'London', country: 'GB', lat: 51.5074, lon: -0.1278 },
          {
            name: 'London',
            country: 'CA',
            state: 'Ontario',
            lat: 42.9849,
            lon: -81.2497,
          },
        ],
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockCacheService.get.mockReturnValue(null);
      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.searchLocation('London');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('London');
      expect(result[0].country).toBe('GB');
      expect(mockCacheService.set).toHaveBeenCalled();
    });

    it('should search by ZIP code', async () => {
      const mockResponse: AxiosResponse = {
        data: { name: 'New York', country: 'US', lat: 40.7128, lon: -74.006 },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockCacheService.get.mockReturnValue(null);
      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.searchLocation('10001');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('New York');
      expect(mockHttpService.get).toHaveBeenCalledWith(
        expect.stringContaining('/zip'),
        expect.objectContaining({
          params: expect.objectContaining({
            zip: '10001',
            appid: 'test-api-key',
          }),
        }),
      );
    });

    it('should search by coordinates', async () => {
      const mockResponse: AxiosResponse = {
        data: [
          {
            name: 'New York',
            country: 'US',
            state: 'NY',
            lat: 40.7128,
            lon: -74.006,
          },
        ],
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockCacheService.get.mockReturnValue(null);
      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.searchLocation('40.7128, -74.0060');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('New York');
      expect(mockHttpService.get).toHaveBeenCalledWith(
        expect.stringContaining('/reverse'),
        expect.objectContaining({
          params: expect.objectContaining({
            lat: 40.7128,
            lon: -74.006,
            limit: 1,
            appid: 'test-api-key',
          }),
        }),
      );
    });

    it('should handle empty results for ZIP code not found', async () => {
      const mockError = {
        response: { status: 404 },
        isAxiosError: true,
      };

      mockCacheService.get.mockReturnValue(null);
      mockHttpService.get.mockReturnValue(throwError(() => mockError));

      const result = await service.searchLocation('99999');

      expect(result).toEqual([]);
    });

    it('should return empty array for queries shorter than 3 characters', async () => {
      // Service now validates query length and returns empty array without making API call
      const result = await service.searchLocation('ab');

      expect(mockHttpService.get).not.toHaveBeenCalled();
      expect(mockCacheService.get).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should handle API errors', async () => {
      const mockError = {
        response: { status: 401 },
        isAxiosError: true,
      };

      mockCacheService.get.mockReturnValue(null);
      mockHttpService.get.mockReturnValue(throwError(() => mockError));

      await expect(service.searchLocation('test')).rejects.toThrow();
    });

    it('should round coordinates to 2 decimal places', async () => {
      const mockResponse: AxiosResponse = {
        data: [
          { name: 'Test City', country: 'US', lat: 40.712776, lon: -74.005974 },
        ],
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockCacheService.get.mockReturnValue(null);
      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.searchLocation('Test City');

      expect(result[0].lat).toBe(40.71);
      expect(result[0].lon).toBe(-74.01);
    });
  });

  describe('constructor', () => {
    it('should throw error if API key is missing', () => {
      const mockConfigWithoutKey = {
        get: jest.fn().mockReturnValue(''),
      };

      expect(() => {
        new SearchService(
          mockConfigWithoutKey as any,
          mockHttpService as any,
          mockCacheService as any,
        );
      }).toThrow('OPENWEATHER_API_KEY is required');
    });
  });
});
