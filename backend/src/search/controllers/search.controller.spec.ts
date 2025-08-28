import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from '../services/search.service';
import { RateLimitGuard } from '../../weather/guards/rate-limit.guard';

describe('SearchController', () => {
  let controller: SearchController;
  let searchService: SearchService;

  const mockSearchService = {
    searchLocation: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [{ provide: SearchService, useValue: mockSearchService }],
    })
      .overrideGuard(RateLimitGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<SearchController>(SearchController);
    searchService = module.get<SearchService>(SearchService);

    jest.clearAllMocks();
  });

  describe('searchLocation', () => {
    it('should return search results for valid query', async () => {
      const mockResults = [
        {
          name: 'New York',
          country: 'US',
          state: 'NY',
          lat: 40.71,
          lon: -74.01,
        },
        { name: 'New York', country: 'GB', lat: 53.08, lon: -0.18 },
      ];

      mockSearchService.searchLocation.mockResolvedValue(mockResults);

      const result = await controller.searchLocation('New York');

      expect(result).toEqual(mockResults);
      expect(searchService.searchLocation).toHaveBeenCalledWith('New York');
    });

    it('should throw BadRequest error for missing query', async () => {
      await expect(controller.searchLocation('')).rejects.toThrow(
        new HttpException(
          'Query parameter must be at least 3 characters long',
          HttpStatus.BAD_REQUEST,
        ),
      );

      expect(searchService.searchLocation).not.toHaveBeenCalled();
    });

    it('should throw BadRequest error for query less than 3 characters', async () => {
      await expect(controller.searchLocation('ab')).rejects.toThrow(
        new HttpException(
          'Query parameter must be at least 3 characters long',
          HttpStatus.BAD_REQUEST,
        ),
      );

      expect(searchService.searchLocation).not.toHaveBeenCalled();
    });

    it('should handle undefined query parameter', async () => {
      await expect(controller.searchLocation(undefined as any)).rejects.toThrow(
        new HttpException(
          'Query parameter must be at least 3 characters long',
          HttpStatus.BAD_REQUEST,
        ),
      );

      expect(searchService.searchLocation).not.toHaveBeenCalled();
    });

    it('should accept exactly 3 characters', async () => {
      const mockResults = [
        { name: 'NYC', country: 'US', lat: 40.71, lon: -74.01 },
      ];

      mockSearchService.searchLocation.mockResolvedValue(mockResults);

      const result = await controller.searchLocation('NYC');

      expect(result).toEqual(mockResults);
      expect(searchService.searchLocation).toHaveBeenCalledWith('NYC');
    });

    it('should handle ZIP code queries', async () => {
      const mockResults = [
        { name: 'New York', country: 'US', lat: 40.71, lon: -74.01 },
      ];

      mockSearchService.searchLocation.mockResolvedValue(mockResults);

      const result = await controller.searchLocation('10001');

      expect(result).toEqual(mockResults);
      expect(searchService.searchLocation).toHaveBeenCalledWith('10001');
    });

    it('should handle coordinate queries', async () => {
      const mockResults = [
        {
          name: 'New York',
          country: 'US',
          state: 'NY',
          lat: 40.71,
          lon: -74.01,
        },
      ];

      mockSearchService.searchLocation.mockResolvedValue(mockResults);

      const result = await controller.searchLocation('40.7128,-74.0060');

      expect(result).toEqual(mockResults);
      expect(searchService.searchLocation).toHaveBeenCalledWith(
        '40.7128,-74.0060',
      );
    });

    it('should return empty array when no results found', async () => {
      mockSearchService.searchLocation.mockResolvedValue([]);

      const result = await controller.searchLocation('UnknownPlace');

      expect(result).toEqual([]);
      expect(searchService.searchLocation).toHaveBeenCalledWith('UnknownPlace');
    });

    it('should propagate service errors', async () => {
      const error = new HttpException(
        'API rate limit exceeded',
        HttpStatus.TOO_MANY_REQUESTS,
      );
      mockSearchService.searchLocation.mockRejectedValue(error);

      await expect(controller.searchLocation('test')).rejects.toThrow(error);
    });

    it('should handle special characters in query', async () => {
      const mockResults = [
        {
          name: 'São Paulo',
          country: 'BR',
          state: 'SP',
          lat: -23.55,
          lon: -46.63,
        },
      ];

      mockSearchService.searchLocation.mockResolvedValue(mockResults);

      const result = await controller.searchLocation('São Paulo');

      expect(result).toEqual(mockResults);
      expect(searchService.searchLocation).toHaveBeenCalledWith('São Paulo');
    });
  });
});
