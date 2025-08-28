import { TestBed } from '@angular/core/testing';
import { SettingsService } from './settings.service';

describe('SettingsService', () => {
  let service: SettingsService;
  let localStorageMock: { [key: string]: string } = {};

  beforeEach(() => {
    localStorageMock = {};
    
    const mockLocalStorage = {
      getItem: jest.fn((key: string) => localStorageMock[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete localStorageMock[key];
      }),
      clear: jest.fn(() => {
        localStorageMock = {};
      })
    };
    
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });

    TestBed.configureTestingModule({
      providers: [SettingsService]
    });
    service = TestBed.inject(SettingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load default settings when localStorage is empty', () => {
    const settings = service.settings();
    expect(settings).toEqual({
      units: 'imperial',
      theme: 'auto',
      notifications: true
    });
  });

  it('should load settings from localStorage', () => {
    const savedSettings = {
      units: 'metric' as const,
      theme: 'dark' as const,
      notifications: false
    };
    localStorageMock['bmad_user_settings'] = JSON.stringify(savedSettings);
    
    // Create a new instance to test loading from localStorage
    const newService = new SettingsService();
    expect(newService.settings()).toEqual(savedSettings);
  });

  it('should save settings to localStorage when updated', (done) => {
    service.updateUnits('metric');
    
    // Wait for effect to run
    setTimeout(() => {
      const saved = JSON.parse(localStorageMock['bmad_user_settings']);
      expect(saved.units).toBe('metric');
      done();
    }, 0);
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
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Create a new service with mocked localStorage that throws
    const errorLocalStorage = {
      getItem: jest.fn(() => {
        throw new Error('localStorage error');
      }),
      setItem: jest.fn()
    };
    
    Object.defineProperty(window, 'localStorage', {
      value: errorLocalStorage,
      writable: true
    });

    // Create service in injection context
    TestBed.configureTestingModule({
      providers: [SettingsService]
    });
    const errorService = TestBed.inject(SettingsService);
    
    expect(errorService.settings()).toEqual({
      units: 'imperial',
      theme: 'auto',
      notifications: true
    });
  });
});