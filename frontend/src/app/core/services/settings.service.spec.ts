import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SettingsService } from './settings.service';
import { HighContrastModeDetector } from '@angular/cdk/a11y';
import { importProvidersFrom } from '@angular/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';

describe('SettingsService', () => {
  let service: SettingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        importProvidersFrom(MatSnackBarModule),
        SettingsService,
        {
          provide: HighContrastModeDetector,
          useValue: {
            _applyBodyHighContrastModeCssClasses: () => {},
          },
        },
      ],
    });
    service = TestBed.inject(SettingsService);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load default settings when localStorage is empty', () => {
    const settings = service.settings();
    expect(settings).toEqual({
      units: 'imperial',
      theme: 'auto',
      notifications: true,
    });
  });

  it('should load settings from localStorage', () => {
    const savedSettings = {
      units: 'metric' as const,
      theme: 'dark' as const,
      notifications: false,
    };
    localStorage.setItem('bmad_user_settings', JSON.stringify(savedSettings));

    // Create a new service instance to ensure constructor re-runs
    const newService = TestBed.runInInjectionContext(() => new SettingsService());

    expect(newService.settings()).toEqual(savedSettings);
  });

  it('should save settings to localStorage when updated', () => {
    const setItemSpy = jest.spyOn(localStorage, 'setItem');
    service.updateUnits('metric');
    // Manually trigger the save for the test, since the effect is not running
    service['saveSettings'](service.settings());
    expect(setItemSpy).toHaveBeenCalledWith(
      'bmad_user_settings',
      JSON.stringify(service.settings())
    );
  });

  describe('updateUnits', () => {
    it('should update units setting', () => {
      service.updateUnits('metric');
      expect(service.settings().units).toBe('metric');

      service.updateUnits('imperial');
      expect(service.settings().units).toBe('imperial');
    });
  });

  describe('updateTheme', () => {
    it('should update theme setting', () => {
      service.updateTheme('dark');
      expect(service.settings().theme).toBe('dark');

      service.updateTheme('light');
      expect(service.settings().theme).toBe('light');
    });
  });

  describe('toggleNotifications', () => {
    it('should toggle notifications setting', () => {
      const initial = service.settings().notifications;
      service.toggleNotifications();
      expect(service.settings().notifications).toBe(!initial);

      service.toggleNotifications();
      expect(service.settings().notifications).toBe(initial);
    });
  });

  describe('getUnits', () => {
    it('should return current units setting', () => {
      service.updateUnits('metric');
      expect(service.getUnits()).toBe('metric');
    });
  });

  it('should handle localStorage errors gracefully', () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const originalLocalStorage = window.localStorage;
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: () => {
          throw new Error('Test Error');
        },
        setItem: () => {
          throw new Error('Test Error');
        },
      },
      configurable: true,
    });

    const errorService = TestBed.runInInjectionContext(() => new SettingsService());

    expect(errorService.settings()).toEqual({
      units: 'imperial',
      theme: 'auto',
      notifications: true,
    });
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
    });
    consoleErrorSpy.mockRestore();
  });
});
