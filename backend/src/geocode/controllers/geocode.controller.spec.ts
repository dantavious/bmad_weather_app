import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { GeocodeController } from './geocode.controller';
import { GeocodeService } from '../services/geocode.service';
import { RateLimitGuard } from '../../weather/guards/rate-limit.guard';

describe('GeocodeController', () => {
  let controller: GeocodeController;
  let geocodeService: jest.Mocked<GeocodeService>;

  beforeEach(async () => {
    const geocodeServiceMock = {
      reverseGeocode: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GeocodeController],
      providers: [
        {
          provide: GeocodeService,
          useValue: geocodeServiceMock,
        },
      ],
    })
      .overrideGuard(RateLimitGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<GeocodeController>(GeocodeController);
    geocodeService = module.get(GeocodeService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('reverseGeocode', () => {
    it('should return location name for valid coordinates', async () => {
      const mockResult = { locationName: 'Seattle, WA, US' };
      geocodeService.reverseGeocode.mockResolvedValue(mockResult);

      const result = await controller.reverseGeocode('47.6', '-122.3');

      expect(geocodeService.reverseGeocode).toHaveBeenCalledWith(47.6, -122.3);
      expect(result).toEqual(mockResult);
    });

    it('should handle decimal coordinates', async () => {
      const mockResult = { locationName: 'New York, NY, US' };
      geocodeService.reverseGeocode.mockResolvedValue(mockResult);

      const result = await controller.reverseGeocode('40.7128', '-74.0060');

      expect(geocodeService.reverseGeocode).toHaveBeenCalledWith(
        40.7128,
        -74.006,
      );
      expect(result).toEqual(mockResult);
    });

    it('should throw error when lat is missing', async () => {
      await expect(controller.reverseGeocode('', '-122.3')).rejects.toThrow(
        new HttpException(
          'Both lat and lng parameters are required',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('should throw error when lng is missing', async () => {
      await expect(controller.reverseGeocode('47.6', '')).rejects.toThrow(
        new HttpException(
          'Both lat and lng parameters are required',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('should throw error when both parameters are missing', async () => {
      await expect(controller.reverseGeocode('', '')).rejects.toThrow(
        new HttpException(
          'Both lat and lng parameters are required',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('should throw error for invalid latitude (not a number)', async () => {
      await expect(
        controller.reverseGeocode('invalid', '-122.3'),
      ).rejects.toThrow(
        new HttpException(
          'Invalid coordinates provided',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('should throw error for invalid longitude (not a number)', async () => {
      await expect(
        controller.reverseGeocode('47.6', 'invalid'),
      ).rejects.toThrow(
        new HttpException(
          'Invalid coordinates provided',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('should throw error for latitude out of range (< -90)', async () => {
      await expect(controller.reverseGeocode('-91', '0')).rejects.toThrow(
        new HttpException(
          'Invalid coordinates provided',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('should throw error for latitude out of range (> 90)', async () => {
      await expect(controller.reverseGeocode('91', '0')).rejects.toThrow(
        new HttpException(
          'Invalid coordinates provided',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('should throw error for longitude out of range (< -180)', async () => {
      await expect(controller.reverseGeocode('0', '-181')).rejects.toThrow(
        new HttpException(
          'Invalid coordinates provided',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('should throw error for longitude out of range (> 180)', async () => {
      await expect(controller.reverseGeocode('0', '181')).rejects.toThrow(
        new HttpException(
          'Invalid coordinates provided',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('should accept edge case coordinates (90, 180)', async () => {
      const mockResult = { locationName: '90°, 180°' };
      geocodeService.reverseGeocode.mockResolvedValue(mockResult);

      const result = await controller.reverseGeocode('90', '180');

      expect(geocodeService.reverseGeocode).toHaveBeenCalledWith(90, 180);
      expect(result).toEqual(mockResult);
    });

    it('should accept edge case coordinates (-90, -180)', async () => {
      const mockResult = { locationName: '-90°, -180°' };
      geocodeService.reverseGeocode.mockResolvedValue(mockResult);

      const result = await controller.reverseGeocode('-90', '-180');

      expect(geocodeService.reverseGeocode).toHaveBeenCalledWith(-90, -180);
      expect(result).toEqual(mockResult);
    });

    it('should handle service errors', async () => {
      geocodeService.reverseGeocode.mockRejectedValue(
        new Error('Service error'),
      );

      await expect(controller.reverseGeocode('47.6', '-122.3')).rejects.toThrow(
        'Service error',
      );
    });
  });
});
