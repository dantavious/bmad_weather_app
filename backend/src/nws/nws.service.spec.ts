import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { NwsService, AlertSeverity } from './nws.service';
import { Logger } from '@nestjs/common';

describe('NwsService', () => {
  let service: NwsService;
  let httpService: HttpService;

  const mockNWSResponse = {
    data: {
      features: [
        {
          id: 'alert-1',
          properties: {
            headline: 'Severe Thunderstorm Warning',
            description: 'Severe thunderstorms expected',
            severity: 'Severe',
            certainty: 'Likely',
            urgency: 'Immediate',
            event: 'Severe Thunderstorm Warning',
            effective: new Date().toISOString(),
            expires: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            status: 'Actual',
          },
        },
        {
          id: 'alert-2',
          properties: {
            headline: 'Flash Flood Watch',
            description: 'Flash flooding possible',
            severity: 'Moderate',
            certainty: 'Possible',
            urgency: 'Expected',
            event: 'Flash Flood Watch',
            effective: new Date().toISOString(),
            expires: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
            status: 'Actual',
          },
        },
        {
          id: 'alert-3',
          properties: {
            headline: 'Wind Advisory',
            description: 'Strong winds expected',
            severity: 'Minor',
            certainty: 'Likely',
            urgency: 'Expected',
            event: 'Wind Advisory',
            effective: new Date().toISOString(),
            expires: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
            status: 'Actual',
          },
        },
      ],
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NwsService,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NwsService>(NwsService);
    httpService = module.get<HttpService>(HttpService);

    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    service.clearCache();
    service.clearHistoricalAlerts();
  });

  describe('fetchActiveAlerts', () => {
    it('should fetch and parse NWS alerts correctly', async () => {
      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(of(mockNWSResponse as any));

      const alerts = await service.fetchActiveAlerts(40.7128, -74.006, 'loc-1');

      expect(alerts).toHaveLength(3);
      expect(alerts[0]).toMatchObject({
        id: 'alert-1',
        locationId: 'loc-1',
        alertType: AlertSeverity.WARNING,
        headline: 'Severe Thunderstorm Warning',
        source: 'National Weather Service',
        isActive: true,
      });
      expect(alerts[1].alertType).toBe(AlertSeverity.WATCH);
      expect(alerts[2].alertType).toBe(AlertSeverity.ADVISORY);
    });

    it('should return cached alerts within cache time', async () => {
      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(of(mockNWSResponse as any));

      const alerts1 = await service.fetchActiveAlerts(
        40.7128,
        -74.006,
        'loc-1',
      );
      const alerts2 = await service.fetchActiveAlerts(
        40.7128,
        -74.006,
        'loc-1',
      );

      expect(httpService.get).toHaveBeenCalledTimes(1);
      expect(alerts1).toEqual(alerts2);
    });

    it('should handle API errors gracefully', async () => {
      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(throwError(() => new Error('Network error')));

      const alerts = await service.fetchActiveAlerts(40.7128, -74.006, 'loc-1');

      expect(alerts).toEqual([]);
      expect(Logger.prototype.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to fetch NWS alerts'),
      );
    });

    it('should filter out expired alerts', async () => {
      const expiredResponse = {
        data: {
          features: [
            {
              id: 'expired-alert',
              properties: {
                headline: 'Expired Warning',
                description: 'This alert has expired',
                severity: 'Severe',
                certainty: 'Observed',
                urgency: 'Past',
                event: 'Expired Warning',
                effective: '2020-01-01T12:00:00Z',
                expires: '2020-01-01T14:00:00Z',
                status: 'Actual',
              },
            },
          ],
        },
      };

      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(of(expiredResponse as any));

      const alerts = await service.fetchActiveAlerts(40.7128, -74.006, 'loc-1');

      expect(alerts).toHaveLength(0);
    });

    it('should map severity levels correctly', async () => {
      const severityTestResponse = {
        data: {
          features: [
            {
              id: 'extreme',
              properties: {
                headline: 'Extreme Event',
                description: 'Test',
                severity: 'Extreme',
                certainty: 'Observed',
                urgency: 'Immediate',
                event: 'Test',
                effective: '2025-08-30T12:00:00Z',
                expires: '2025-12-31T14:00:00Z',
                status: 'Actual',
              },
            },
            {
              id: 'moderate-likely',
              properties: {
                headline: 'Moderate Event',
                description: 'Test',
                severity: 'Moderate',
                certainty: 'Likely',
                urgency: 'Expected',
                event: 'Test',
                effective: '2025-08-30T12:00:00Z',
                expires: '2025-12-31T14:00:00Z',
                status: 'Actual',
              },
            },
            {
              id: 'moderate-unlikely',
              properties: {
                headline: 'Moderate Unlikely Event',
                description: 'Test',
                severity: 'Moderate',
                certainty: 'Unlikely',
                urgency: 'Expected',
                event: 'Test',
                effective: '2025-08-30T12:00:00Z',
                expires: '2025-12-31T14:00:00Z',
                status: 'Actual',
              },
            },
            {
              id: 'minor',
              properties: {
                headline: 'Minor Event',
                description: 'Test',
                severity: 'Minor',
                certainty: 'Observed',
                urgency: 'Expected',
                event: 'Test',
                effective: '2025-08-30T12:00:00Z',
                expires: '2025-12-31T14:00:00Z',
                status: 'Actual',
              },
            },
          ],
        },
      };

      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(of(severityTestResponse as any));

      const alerts = await service.fetchActiveAlerts(40.7128, -74.006, 'loc-1');

      expect(alerts[0].alertType).toBe(AlertSeverity.WARNING);
      expect(alerts[1].alertType).toBe(AlertSeverity.WATCH);
      expect(alerts[2].alertType).toBe(AlertSeverity.ADVISORY);
      expect(alerts[3].alertType).toBe(AlertSeverity.ADVISORY);
    });
  });

  describe('getHistoricalAlerts', () => {
    it('should return historical alerts for a location', async () => {
      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(of(mockNWSResponse as any));

      await service.fetchActiveAlerts(40.7128, -74.006, 'loc-1');
      const historical = service.getHistoricalAlerts('loc-1');

      expect(historical).toHaveLength(3);
      expect(historical[0].locationId).toBe('loc-1');
    });

    it('should filter out alerts older than 24 hours', async () => {
      const oldAlert = {
        data: {
          features: [
            {
              id: 'old-alert',
              properties: {
                headline: 'Old Warning',
                description: 'This is old',
                severity: 'Severe',
                certainty: 'Observed',
                urgency: 'Past',
                event: 'Old Warning',
                effective: new Date(
                  Date.now() - 25 * 60 * 60 * 1000,
                ).toISOString(),
                expires: new Date(
                  Date.now() + 1 * 60 * 60 * 1000,
                ).toISOString(),
                status: 'Actual',
              },
            },
          ],
        },
      };

      jest.spyOn(httpService, 'get').mockReturnValue(of(oldAlert as any));

      await service.fetchActiveAlerts(40.7128, -74.006, 'loc-1');
      const historical = service.getHistoricalAlerts('loc-1');

      expect(historical).toHaveLength(0);
    });

    it('should return empty array for unknown location', () => {
      const historical = service.getHistoricalAlerts('unknown-location');
      expect(historical).toEqual([]);
    });
  });

  describe('registerLocationCallback', () => {
    it('should register and call location callbacks', async () => {
      const callback = jest.fn();
      service.registerLocationCallback('40.71,-74.01', callback);

      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(of(mockNWSResponse as any));
      await service.checkAllLocationAlerts();

      expect(callback).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            alertType: AlertSeverity.WARNING,
          }),
        ]),
      );
    });

    it('should unregister location callbacks', async () => {
      const callback = jest.fn();
      service.registerLocationCallback('loc-1', callback);
      service.unregisterLocationCallback('loc-1');

      await service.checkAllLocationAlerts();

      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle invalid location coordinates in callback', async () => {
      const callback = jest.fn();
      service.registerLocationCallback('invalid-coords', callback);

      await service.checkAllLocationAlerts();

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('clearCache', () => {
    it('should clear the alert cache', async () => {
      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(of(mockNWSResponse as any));

      await service.fetchActiveAlerts(40.7128, -74.006, 'loc-1');
      service.clearCache();
      await service.fetchActiveAlerts(40.7128, -74.006, 'loc-1');

      expect(httpService.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('clearHistoricalAlerts', () => {
    it('should clear historical alerts for specific location', async () => {
      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(of(mockNWSResponse as any));

      await service.fetchActiveAlerts(40.7128, -74.006, 'loc-1');
      service.clearHistoricalAlerts('loc-1');
      const historical = service.getHistoricalAlerts('loc-1');

      expect(historical).toEqual([]);
    });

    it('should clear all historical alerts when no location specified', async () => {
      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(of(mockNWSResponse as any));

      await service.fetchActiveAlerts(40.7128, -74.006, 'loc-1');
      await service.fetchActiveAlerts(41.8781, -87.6298, 'loc-2');
      service.clearHistoricalAlerts();

      expect(service.getHistoricalAlerts('loc-1')).toEqual([]);
      expect(service.getHistoricalAlerts('loc-2')).toEqual([]);
    });
  });
});
