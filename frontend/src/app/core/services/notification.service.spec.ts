import { TestBed } from '@angular/core/testing';
import {
  NotificationService,
  NotificationPreferences,
  PrecipitationNotification,
} from './notification.service';
import { StorageService } from './storage.service';
import { importProvidersFrom } from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';
import { PlatformModule } from '@angular/cdk/platform';
import { LayoutModule } from '@angular/cdk/layout';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('NotificationService', () => {
  let service: NotificationService;
  let storageService: jest.Mocked<StorageService>;

  // Mock Notification API
  const mockNotification = {
    permission: 'default' as NotificationPermission,
    requestPermission: jest.fn(),
  };

  beforeEach(() => {
    const storageSpy = {
      get: jest.fn(),
      set: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: StorageService, useValue: storageSpy },
        importProvidersFrom(
          A11yModule,
          PlatformModule,
          LayoutModule,
          NoopAnimationsModule
        ),
      ],
    });

    storageService = TestBed.inject(
      StorageService
    ) as jest.Mocked<StorageService>;

    // Setup Notification mock
    (window as any).Notification = mockNotification;
    mockNotification.permission = 'default';

    service = TestBed.inject(NotificationService);
  });

  afterEach(() => {
    mockNotification.requestPermission.mockClear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('permission management', () => {
    it('should check notification permission on init', () => {
      expect(service.notificationPermission()).toBe('default');
    });

    it('should request permission when enabling notifications', async () => {
      mockNotification.requestPermission.mockResolvedValue('granted');
      mockNotification.permission = 'granted';

      const result = await service.requestPermission();

      expect(mockNotification.requestPermission).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false when permission is denied', async () => {
      mockNotification.permission = 'denied';

      const result = await service.requestPermission();

      expect(result).toBe(false);
    });

    it('should enable notifications when permission is granted', async () => {
      mockNotification.requestPermission.mockResolvedValue('granted');
      mockNotification.permission = 'granted';
      storageService.set.mockResolvedValue();

      const result = await service.enableNotifications();

      expect(result).toBe(true);
      expect(service.preferences().enabled).toBe(true);
      expect(storageService.set).toHaveBeenCalled();
    });

    it('should not enable notifications when permission is denied', async () => {
      mockNotification.requestPermission.mockResolvedValue('denied');
      mockNotification.permission = 'denied';

      const result = await service.enableNotifications();

      expect(result).toBe(false);
      expect(service.preferences().enabled).toBe(false);
    });
  });

  describe('preferences management', () => {
    it('should load saved preferences', async () => {
      const savedPrefs = {
        enabled: true,
        quietHoursEnabled: true,
        quietHoursStart: '23:00',
        quietHoursEnd: '07:00',
        locationAlerts: [['loc1', true], ['loc2', false]],
      };
      
      storageService.get.mockResolvedValue(savedPrefs);
      
      // Recreate service to trigger loadPreferences
      service = new NotificationService();
      await new Promise(resolve => setTimeout(resolve, 10)); // Wait for async load
      
      const prefs = service.preferences();
      expect(prefs.enabled).toBe(true);
      expect(prefs.quietHoursEnabled).toBe(true);
      expect(prefs.locationAlerts.get('loc1')).toBe(true);
      expect(prefs.locationAlerts.get('loc2')).toBe(false);
    });

    it('should disable notifications', async () => {
      storageService.set.mockResolvedValue();
      service.preferences.update(prefs => ({ ...prefs, enabled: true }));

      await service.disableNotifications();

      expect(service.preferences().enabled).toBe(false);
      expect(storageService.set).toHaveBeenCalled();
    });

    it('should set location alert preferences', async () => {
      storageService.set.mockResolvedValue();

      await service.setLocationAlertEnabled('location1', true);
      expect(service.isLocationAlertEnabled('location1')).toBe(true);

      await service.setLocationAlertEnabled('location1', false);
      expect(service.isLocationAlertEnabled('location1')).toBe(false);
    });

    it('should default to enabled for unknown locations', () => {
      expect(service.isLocationAlertEnabled('unknown-location')).toBe(true);
    });

    it('should set quiet hours', async () => {
      storageService.set.mockResolvedValue();

      await service.setQuietHours(true, '22:00', '06:00');

      const prefs = service.preferences();
      expect(prefs.quietHoursEnabled).toBe(true);
      expect(prefs.quietHoursStart).toBe('22:00');
      expect(prefs.quietHoursEnd).toBe('06:00');
    });
  });

  describe('quiet hours detection', () => {
    it('should not be in quiet hours when disabled', () => {
      service.preferences.update(prefs => ({
        ...prefs,
        quietHoursEnabled: false,
      }));

      // Use private method through any type
      const isInQuietHours = (service as any).isInQuietHours();
      expect(isInQuietHours).toBe(false);
    });

    it('should detect quiet hours that do not cross midnight', () => {
      const now = new Date();
      const currentHour = now.getHours();
      
      // Set quiet hours around current time
      const startHour = (currentHour - 1 + 24) % 24;
      const endHour = (currentHour + 1) % 24;
      
      service.preferences.update(prefs => ({
        ...prefs,
        quietHoursEnabled: true,
        quietHoursStart: `${startHour.toString().padStart(2, '0')}:00`,
        quietHoursEnd: `${endHour.toString().padStart(2, '0')}:00`,
      }));

      const isInQuietHours = (service as any).isInQuietHours();
      expect(isInQuietHours).toBe(true);
    });

    it('should detect quiet hours that cross midnight', () => {
      const now = new Date();
      now.setHours(23, 30); // 11:30 PM
      
      service.preferences.update(prefs => ({
        ...prefs,
        quietHoursEnabled: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '06:00',
      }));

      // Mock current time to be 11:30 PM
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(23);
      jest.spyOn(Date.prototype, 'getMinutes').mockReturnValue(30);

      const isInQuietHours = (service as any).isInQuietHours();
      expect(isInQuietHours).toBe(true);
    });
  });

  describe('precipitation alert display', () => {
    beforeEach(() => {
      mockNotification.permission = 'granted';
      storageService.set.mockResolvedValue();
    });

    it('should not show alert when notifications are disabled', async () => {
      service.preferences.update(prefs => ({ ...prefs, enabled: false }));
      
      const notification: PrecipitationNotification = {
        locationId: 'loc1',
        locationName: 'Test Location',
        minutesToStart: 10,
        precipitationType: 'Rain',
        intensity: 'Light',
        estimatedDuration: 30,
      };

      const notificationSpy = jest.fn();
      (window as any).Notification = notificationSpy;
      await service.showPrecipitationAlert(notification);
      
      expect(notificationSpy).not.toHaveBeenCalled();
    });

    it('should not show alert for disabled location', async () => {
      service.preferences.update(prefs => ({
        ...prefs,
        enabled: true,
        locationAlerts: new Map([['loc1', false]]),
      }));

      const notification: PrecipitationNotification = {
        locationId: 'loc1',
        locationName: 'Test Location',
        minutesToStart: 10,
        precipitationType: 'Rain',
        intensity: 'Light',
        estimatedDuration: 30,
      };

      const notificationSpy = jest.fn();
      (window as any).Notification = notificationSpy;
      await service.showPrecipitationAlert(notification);
      
      expect(notificationSpy).not.toHaveBeenCalled();
    });

    it('should not show alert during quiet hours', async () => {
      service.preferences.update(prefs => ({
        ...prefs,
        enabled: true,
        quietHoursEnabled: true,
      }));

      // Mock isInQuietHours to return true
      jest.spyOn(service as any, 'isInQuietHours').mockReturnValue(true);

      const notification: PrecipitationNotification = {
        locationId: 'loc1',
        locationName: 'Test Location',
        minutesToStart: 10,
        precipitationType: 'Rain',
        intensity: 'Light',
        estimatedDuration: 30,
      };

      const notificationSpy = jest.fn();
      (window as any).Notification = notificationSpy;
      await service.showPrecipitationAlert(notification);
      
      expect(notificationSpy).not.toHaveBeenCalled();
    });

    it('should show alert when all conditions are met', async () => {
      service.preferences.update(prefs => ({
        ...prefs,
        enabled: true,
        quietHoursEnabled: false,
      }));

      const notification: PrecipitationNotification = {
        locationId: 'loc1',
        locationName: 'Test Location',
        minutesToStart: 10,
        precipitationType: 'Rain',
        intensity: 'Light',
        estimatedDuration: 30,
      };

      const notificationSpy = jest.fn();
      (window as any).Notification = notificationSpy;
      notificationSpy.permission = 'granted';

      await service.showPrecipitationAlert(notification);
      
      expect(notificationSpy).toHaveBeenCalledWith(
        'Rain starting soon',
        expect.objectContaining({
          body: expect.stringContaining('Light Rain expected in 10 minutes'),
        }),
      );
    });
  });

  describe('test notification', () => {
    it('should send a test notification', async () => {
      service.preferences.update(prefs => ({
        ...prefs,
        enabled: true,
      }));

      const notificationSpy = jest.fn();
      (window as any).Notification = notificationSpy;
      notificationSpy.permission = 'granted';

      await service.testNotification();

      expect(notificationSpy).toHaveBeenCalledWith(
        'Rain starting soon',
        expect.objectContaining({
          body: expect.stringContaining('Test Location'),
        }),
      );
    });
  });
});
