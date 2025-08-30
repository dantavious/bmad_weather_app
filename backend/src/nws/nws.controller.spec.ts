import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { NwsController } from './nws.controller';
import { NwsService, WeatherAlert, AlertSeverity } from './nws.service';

describe('NwsController', () => {
  let controller: NwsController;
  let service: NwsService;

  const mockAlerts: WeatherAlert[] = [
    {
      id: 'alert-1',
      locationId: 'loc-1',
      alertType: AlertSeverity.WARNING,
      headline: 'Severe Thunderstorm Warning',
      description: 'Severe thunderstorms expected',
      startTime: new Date('2025-08-30T12:00:00Z'),
      endTime: new Date('2025-08-30T14:00:00Z'),
      source: 'National Weather Service',
      isActive: true,
    },
    {
      id: 'alert-2',
      locationId: 'loc-1',
      alertType: AlertSeverity.WATCH,
      headline: 'Flash Flood Watch',
      description: 'Flash flooding possible',
      startTime: new Date('2025-08-30T10:00:00Z'),
      endTime: new Date('2025-08-30T18:00:00Z'),
      source: 'National Weather Service',
      isActive: true,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NwsController],
      providers: [
        {
          provide: NwsService,
          useValue: {
            fetchActiveAlerts: jest.fn(),
            getHistoricalAlerts: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<NwsController>(NwsController);
    service = module.get<NwsService>(NwsService);
  });

  describe('getActiveAlerts', () => {
    it('should return active alerts for valid coordinates', async () => {
      jest.spyOn(service, 'fetchActiveAlerts').mockResolvedValue(mockAlerts);

      const result = await controller.getActiveAlerts('loc-1', '40.7128', '-74.0060');

      expect(result).toEqual(mockAlerts);
      expect(service.fetchActiveAlerts).toHaveBeenCalledWith(40.7128, -74.0060, 'loc-1');
    });

    it('should throw BadRequest for invalid latitude', async () => {
      await expect(
        controller.getActiveAlerts('loc-1', 'invalid', '-74.0060')
      ).rejects.toThrow(
        new HttpException('Invalid coordinates', HttpStatus.BAD_REQUEST)
      );
    });

    it('should throw BadRequest for invalid longitude', async () => {
      await expect(
        controller.getActiveAlerts('loc-1', '40.7128', 'invalid')
      ).rejects.toThrow(
        new HttpException('Invalid coordinates', HttpStatus.BAD_REQUEST)
      );
    });

    it('should throw BadRequest for missing coordinates', async () => {
      await expect(
        controller.getActiveAlerts('loc-1', undefined, undefined)
      ).rejects.toThrow(
        new HttpException('Invalid coordinates', HttpStatus.BAD_REQUEST)
      );
    });

    it('should handle service errors gracefully', async () => {
      jest.spyOn(service, 'fetchActiveAlerts').mockRejectedValue(
        new Error('Service error')
      );

      await expect(
        controller.getActiveAlerts('loc-1', '40.7128', '-74.0060')
      ).rejects.toThrow(
        new HttpException('Failed to fetch weather alerts', HttpStatus.INTERNAL_SERVER_ERROR)
      );
    });

    it('should preserve HttpException from service', async () => {
      const serviceException = new HttpException('Custom error', HttpStatus.SERVICE_UNAVAILABLE);
      jest.spyOn(service, 'fetchActiveAlerts').mockRejectedValue(serviceException);

      await expect(
        controller.getActiveAlerts('loc-1', '40.7128', '-74.0060')
      ).rejects.toThrow(serviceException);
    });

    it('should handle edge case coordinates', async () => {
      jest.spyOn(service, 'fetchActiveAlerts').mockResolvedValue([]);

      const result = await controller.getActiveAlerts('loc-1', '90', '-180');

      expect(result).toEqual([]);
      expect(service.fetchActiveAlerts).toHaveBeenCalledWith(90, -180, 'loc-1');
    });

    it('should handle coordinates with many decimal places', async () => {
      jest.spyOn(service, 'fetchActiveAlerts').mockResolvedValue(mockAlerts);

      const result = await controller.getActiveAlerts('loc-1', '40.71289999', '-74.00609999');

      expect(result).toEqual(mockAlerts);
      expect(service.fetchActiveAlerts).toHaveBeenCalledWith(40.71289999, -74.00609999, 'loc-1');
    });
  });

  describe('getHistoricalAlerts', () => {
    it('should return historical alerts for a location', async () => {
      jest.spyOn(service, 'getHistoricalAlerts').mockReturnValue(mockAlerts);

      const result = await controller.getHistoricalAlerts('loc-1');

      expect(result).toEqual(mockAlerts);
      expect(service.getHistoricalAlerts).toHaveBeenCalledWith('loc-1');
    });

    it('should return empty array for location with no historical alerts', async () => {
      jest.spyOn(service, 'getHistoricalAlerts').mockReturnValue([]);

      const result = await controller.getHistoricalAlerts('unknown-location');

      expect(result).toEqual([]);
      expect(service.getHistoricalAlerts).toHaveBeenCalledWith('unknown-location');
    });

    it('should handle service errors gracefully', async () => {
      jest.spyOn(service, 'getHistoricalAlerts').mockImplementation(() => {
        throw new Error('Service error');
      });

      await expect(
        controller.getHistoricalAlerts('loc-1')
      ).rejects.toThrow(
        new HttpException('Failed to fetch historical alerts', HttpStatus.INTERNAL_SERVER_ERROR)
      );
    });

    it('should handle special characters in locationId', async () => {
      jest.spyOn(service, 'getHistoricalAlerts').mockReturnValue([]);

      const result = await controller.getHistoricalAlerts('loc-1@#$%');

      expect(result).toEqual([]);
      expect(service.getHistoricalAlerts).toHaveBeenCalledWith('loc-1@#$%');
    });
  });
});