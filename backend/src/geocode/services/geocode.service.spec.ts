import { Test, TestingModule } from '@nestjs/testing';
import { GeocodeService } from './geocode.service';
import { SearchService } from '../../search/services/search.service';
import { LocationSearchResult } from '@shared/models/location.model';

describe('GeocodeService', () => {
  let service: GeocodeService;
  let searchService: jest.Mocked<SearchService>;

  beforeEach(async () => {
    const searchServiceMock = {
      searchLocation: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeocodeService,
        {
          provide: SearchService,
          useValue: searchServiceMock,
        },
      ],
    }).compile();

    service = module.get<GeocodeService>(GeocodeService);
    searchService = module.get(SearchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('reverseGeocode', () => {
    it('should return location name for valid coordinates', async () => {
      const mockResults: LocationSearchResult[] = [
        {
          name: 'Seattle',
          state: 'WA',
          country: 'US',
          lat: 47.6,
          lon: -122.3,
        },
      ];

      searchService.searchLocation.mockResolvedValue(mockResults);

      const result = await service.reverseGeocode(47.6062, -122.3321);

      expect(searchService.searchLocation).toHaveBeenCalledWith(
        '47.61,-122.33',
      );
      expect(result).toEqual({ locationName: 'Seattle, WA, US' });
    });

    it('should round coordinates to 2 decimal places', async () => {
      const mockResults: LocationSearchResult[] = [
        {
          name: 'New York',
          state: 'NY',
          country: 'US',
          lat: 40.71,
          lon: -74.01,
        },
      ];

      searchService.searchLocation.mockResolvedValue(mockResults);

      const result = await service.reverseGeocode(40.7128, -74.006);

      expect(searchService.searchLocation).toHaveBeenCalledWith('40.71,-74.01');
      expect(result).toEqual({ locationName: 'New York, NY, US' });
    });

    it('should handle location without state', async () => {
      const mockResults: LocationSearchResult[] = [
        {
          name: 'London',
          country: 'GB',
          lat: 51.51,
          lon: -0.13,
        },
      ];

      searchService.searchLocation.mockResolvedValue(mockResults);

      const result = await service.reverseGeocode(51.5074, -0.1278);

      expect(result).toEqual({ locationName: 'London, GB' });
    });

    it('should handle location with only name', async () => {
      const mockResults: LocationSearchResult[] = [
        {
          name: 'Unknown Place',
          lat: 0,
          lon: 0,
        },
      ];

      searchService.searchLocation.mockResolvedValue(mockResults);

      const result = await service.reverseGeocode(0, 0);

      expect(result).toEqual({ locationName: 'Unknown Place' });
    });

    it('should return coordinates when no results found', async () => {
      searchService.searchLocation.mockResolvedValue([]);

      const result = await service.reverseGeocode(12.3456, -78.9012);

      expect(searchService.searchLocation).toHaveBeenCalledWith('12.35,-78.9');
      expect(result).toEqual({ locationName: '12.35°, -78.9°' });
    });

    it('should handle search service errors gracefully', async () => {
      searchService.searchLocation.mockRejectedValue(new Error('API error'));

      await expect(service.reverseGeocode(40.7, -74.0)).rejects.toThrow(
        'API error',
      );
    });
  });
});
