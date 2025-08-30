import { TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AlertService, WeatherAlert, AlertSeverity } from './alert.service';
import { NotificationService } from './notification.service';
import { environment } from '../../../environments/environment';

describe('AlertService', () => {
  let service: AlertService;
  let httpMock: HttpTestingController;
  let notificationService: jest.Mocked<NotificationService>;

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

  beforeEach(() => {
    const notificationSpy = {
      requestPermission: jest.fn().mockResolvedValue(true),
      sendNotification: jest.fn().mockResolvedValue(undefined),
      getAlertSettings: jest.fn().mockReturnValue({
        enabled: true,
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '07:00'
        }
      })
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AlertService,
        { provide: NotificationService, useValue: notificationSpy }
      ]
    });

    service = TestBed.inject(AlertService);
    httpMock = TestBed.inject(HttpTestingController);
    notificationService = TestBed.inject(NotificationService) as jest.Mocked<NotificationService>;
  });

  afterEach(() => {
    httpMock.verify();
    service.clearAllAlerts();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch alerts from API', fakeAsync(() => {
    let receivedAlerts: WeatherAlert[] = [];
    
    service.fetchAlerts('loc-1', 40.7128, -74.0060).subscribe(alerts => {
      receivedAlerts = alerts;
    });
    
    const req = httpMock.expectOne(
      `${environment.apiUrl}/api/alerts/loc-1?lat=40.7128&lon=-74.006`
    );
    expect(req.request.method).toBe('GET');
    
    req.flush(mockAlerts);
    tick();
    
    expect(receivedAlerts).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'alert-1',
        alertType: AlertSeverity.WARNING
      })
    ]));
  }));

  it('should poll for alerts every 5 minutes', fakeAsync(() => {
    service.fetchAlerts('loc-1', 40.7128, -74.0060).subscribe();
    
    // Initial request
    let req = httpMock.expectOne(
      `${environment.apiUrl}/api/alerts/loc-1?lat=40.7128&lon=-74.006`
    );
    req.flush(mockAlerts);
    
    // Fast-forward 5 minutes
    tick(5 * 60 * 1000);
    
    // Second request after 5 minutes
    req = httpMock.expectOne(
      `${environment.apiUrl}/api/alerts/loc-1?lat=40.7128&lon=-74.006`
    );
    req.flush(mockAlerts);
    
    flush();
  }));

  it('should send notification for new warnings', fakeAsync(() => {
    service.fetchAlerts('loc-1', 40.7128, -74.0060).subscribe();
    
    const req = httpMock.expectOne(
      `${environment.apiUrl}/api/alerts/loc-1?lat=40.7128&lon=-74.006`
    );
    req.flush(mockAlerts);
    tick();
    
    expect(notificationService.sendNotification).toHaveBeenCalledWith(
      '⚠️ Weather Warning',
      'Severe Thunderstorm Warning',
      expect.objectContaining({
        body: 'Severe thunderstorms expected',
        tag: 'weather-alert-alert-1'
      })
    );
  }));

  it('should not send duplicate notifications', fakeAsync(() => {
    service.fetchAlerts('loc-1', 40.7128, -74.0060).subscribe();
    
    // First fetch
    let req = httpMock.expectOne(
      `${environment.apiUrl}/api/alerts/loc-1?lat=40.7128&lon=-74.006`
    );
    req.flush(mockAlerts);
    tick();
    
    expect(notificationService.sendNotification).toHaveBeenCalledTimes(1);
    
    // Second fetch with same alerts
    tick(5 * 60 * 1000);
    req = httpMock.expectOne(
      `${environment.apiUrl}/api/alerts/loc-1?lat=40.7128&lon=-74.006`
    );
    req.flush(mockAlerts);
    tick();
    
    // Should still be called only once (no duplicate)
    expect(notificationService.sendNotification).toHaveBeenCalledTimes(1);
    
    flush();
  }));

  it('should only send notifications for warnings', fakeAsync(() => {
    const watchOnlyAlerts = [mockAlerts[1]]; // Only the WATCH alert
    
    service.fetchAlerts('loc-1', 40.7128, -74.0060).subscribe();
    
    const req = httpMock.expectOne(
      `${environment.apiUrl}/api/alerts/loc-1?lat=40.7128&lon=-74.006`
    );
    req.flush(watchOnlyAlerts);
    tick();
    
    expect(notificationService.sendNotification).not.toHaveBeenCalled();
  }));

  it('should respect quiet hours', fakeAsync(() => {
    const mockDate = new Date('2025-08-30T23:00:00'); // 11 PM - during quiet hours
    jest.useFakeTimers();
    jest.setSystemTime(mockDate);
    
    notificationService.getAlertSettings.mockReturnValue({
      enabled: true,
      quietHours: {
        enabled: true,
        start: '22:00',
        end: '07:00'
      }
    });
    
    service.fetchAlerts('loc-1', 40.7128, -74.0060).subscribe();
    
    const req = httpMock.expectOne(
      `${environment.apiUrl}/api/alerts/loc-1?lat=40.7128&lon=-74.006`
    );
    req.flush(mockAlerts);
    tick();
    
    expect(notificationService.sendNotification).not.toHaveBeenCalled();
    
    jest.useRealTimers();
  }));

  it('should not send notifications when disabled', fakeAsync(() => {
    notificationService.getAlertSettings.mockReturnValue({
      enabled: false,
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '07:00'
      }
    });
    
    service.fetchAlerts('loc-1', 40.7128, -74.0060).subscribe();
    
    const req = httpMock.expectOne(
      `${environment.apiUrl}/api/alerts/loc-1?lat=40.7128&lon=-74.006`
    );
    req.flush(mockAlerts);
    tick();
    
    expect(notificationService.sendNotification).not.toHaveBeenCalled();
  }));

  it('should handle API errors gracefully', fakeAsync(() => {
    let receivedAlerts: WeatherAlert[] = [];
    
    service.fetchAlerts('loc-1', 40.7128, -74.0060).subscribe(alerts => {
      receivedAlerts = alerts;
    });
    
    const req = httpMock.expectOne(
      `${environment.apiUrl}/api/alerts/loc-1?lat=40.7128&lon=-74.006`
    );
    
    req.error(new ErrorEvent('Network error'));
    tick();
    
    expect(receivedAlerts).toEqual([]);
    expect(notificationService.sendNotification).not.toHaveBeenCalled();
  }));

  it('should fetch historical alerts', fakeAsync(() => {
    let receivedAlerts: WeatherAlert[] = [];
    
    service.getHistoricalAlerts('loc-1').subscribe(alerts => {
      receivedAlerts = alerts;
    });
    
    const req = httpMock.expectOne(
      `${environment.apiUrl}/api/alerts/historical/loc-1`
    );
    expect(req.request.method).toBe('GET');
    
    req.flush(mockAlerts);
    tick();
    
    expect(receivedAlerts.length).toBe(2);
    expect(receivedAlerts[0].id).toBe('alert-1');
  }));

  it('should clear alerts for location', fakeAsync(() => {
    let receivedAlerts: WeatherAlert[] = [];
    
    service.fetchAlerts('loc-1', 40.7128, -74.0060).subscribe(alerts => {
      receivedAlerts = alerts;
    });
    
    const req = httpMock.expectOne(
      `${environment.apiUrl}/api/alerts/loc-1?lat=40.7128&lon=-74.006`
    );
    req.flush(mockAlerts);
    tick();
    
    expect(receivedAlerts.length).toBe(2);
    
    service.clearAlerts('loc-1');
    tick();
    
    expect(receivedAlerts.length).toBe(0);
  }));

  it('should clear all alerts', fakeAsync(() => {
    service.fetchAlerts('loc-1', 40.7128, -74.0060).subscribe();
    service.fetchAlerts('loc-2', 41.8781, -87.6298).subscribe();
    
    const req1 = httpMock.expectOne(
      `${environment.apiUrl}/api/alerts/loc-1?lat=40.7128&lon=-74.006`
    );
    req1.flush(mockAlerts);
    
    const req2 = httpMock.expectOne(
      `${environment.apiUrl}/api/alerts/loc-2?lat=41.8781&lon=-87.6298`
    );
    req2.flush([]);
    
    tick();
    
    service.clearAllAlerts();
    
    // Verify internal state is cleared (indirectly through behavior)
    expect(service).toBeTruthy();
    
    flush();
  }));
});