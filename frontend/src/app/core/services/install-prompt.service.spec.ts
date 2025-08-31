import { TestBed } from '@angular/core/testing';
import { SwUpdate } from '@angular/service-worker';
import { of, Subject } from 'rxjs';
import { InstallPromptService } from './install-prompt.service';

describe('InstallPromptService', () => {
  let service: InstallPromptService;
  let mockSwUpdate: any;
  let mockLocalStorage: { [key: string]: string };
  let versionUpdatesSubject: Subject<any>;

  beforeEach(() => {
    mockLocalStorage = {};
    versionUpdatesSubject = new Subject();

    mockSwUpdate = {
      checkForUpdate: jest.fn(),
      isEnabled: true,
      versionUpdates: versionUpdatesSubject.asObservable()
    };

    jest.spyOn(localStorage, 'getItem').mockImplementation((key: string) => mockLocalStorage[key] || null);
    jest.spyOn(localStorage, 'setItem').mockImplementation((key: string, value: string) => {
      mockLocalStorage[key] = value;
    });
    jest.spyOn(localStorage, 'removeItem').mockImplementation((key: string) => {
      delete mockLocalStorage[key];
    });

    TestBed.configureTestingModule({
      providers: [
        InstallPromptService,
        { provide: SwUpdate, useValue: mockSwUpdate }
      ]
    });
  });

  describe('Visit counting', () => {
    it('should increment visit count on first visit', () => {
      service = TestBed.inject(InstallPromptService);
      expect(localStorage.setItem).toHaveBeenCalledWith('bmad_visit_count', '1');
    });

    it('should increment visit count on subsequent visits', () => {
      mockLocalStorage['bmad_visit_count'] = '2';
      service = TestBed.inject(InstallPromptService);
      expect(localStorage.setItem).toHaveBeenCalledWith('bmad_visit_count', '3');
    });
  });

  describe('Install prompt eligibility', () => {
    it('should not allow install on first visit', () => {
      service = TestBed.inject(InstallPromptService);
      expect(service.canInstall()).toBeFalsy();
    });

    it('should allow install on second visit with prompt available', () => {
      mockLocalStorage['bmad_visit_count'] = '1';
      service = TestBed.inject(InstallPromptService);
      
      const mockPromptEvent = {
        preventDefault: jest.fn(),
        prompt: jest.fn(),
        userChoice: Promise.resolve({ outcome: 'dismissed' })
      };
      
      window.dispatchEvent(new CustomEvent('beforeinstallprompt', { detail: mockPromptEvent }));
      
      expect(service.canInstall()).toBeTruthy();
    });

    it('should not allow install if previously dismissed', () => {
      mockLocalStorage['bmad_visit_count'] = '2';
      mockLocalStorage['bmad_install_dismissed'] = 'true';
      service = TestBed.inject(InstallPromptService);
      expect(service.canInstall()).toBeFalsy();
    });
  });

  describe('Install prompt interactions', () => {
    let mockPromptEvent: any;

    beforeEach(() => {
      mockLocalStorage['bmad_visit_count'] = '1';
      service = TestBed.inject(InstallPromptService);
      
      mockPromptEvent = {
        preventDefault: jest.fn(),
        prompt: jest.fn(),
        userChoice: Promise.resolve({ outcome: 'accepted' })
      };
      
      const event = new CustomEvent('beforeinstallprompt') as any;
      Object.assign(event, mockPromptEvent);
      window.dispatchEvent(event);
    });

    it('should show install prompt when requested', async () => {
      await service.showInstallPrompt();
      expect(mockPromptEvent.prompt).toHaveBeenCalled();
    });

    it('should mark as installed when user accepts', async () => {
      await service.showInstallPrompt();
      expect(service.isInstalled()).toBeTruthy();
    });

    it('should mark as dismissed when user declines', async () => {
      mockPromptEvent.userChoice = Promise.resolve({ outcome: 'dismissed' });
      await service.showInstallPrompt();
      expect(localStorage.setItem).toHaveBeenCalledWith('bmad_install_dismissed', 'true');
    });
  });

  describe('Dismissal handling', () => {
    beforeEach(() => {
      service = TestBed.inject(InstallPromptService);
    });

    it('should persist dismissal state', () => {
      service.dismissInstallPrompt();
      expect(localStorage.setItem).toHaveBeenCalledWith('bmad_install_dismissed', 'true');
    });

    it('should reset dismissal state', () => {
      service.dismissInstallPrompt();
      service.resetDismissal();
      expect(localStorage.removeItem).toHaveBeenCalledWith('bmad_install_dismissed');
    });
  });

  describe('App installed detection', () => {
    it('should detect standalone display mode', () => {
      jest.spyOn(window, 'matchMedia').mockReturnValue({
        matches: true,
        media: '(display-mode: standalone)',
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn()
      } as any);
      
      service = TestBed.inject(InstallPromptService);
      expect(service.isInstalled()).toBeTruthy();
    });

    it('should handle appinstalled event', () => {
      service = TestBed.inject(InstallPromptService);
      window.dispatchEvent(new Event('appinstalled'));
      expect(service.isInstalled()).toBeTruthy();
    });
  });

  describe('Service worker updates', () => {
    beforeEach(() => {
      service = TestBed.inject(InstallPromptService);
    });

    it('should check for updates periodically', () => {
      jest.useFakeTimers();
      jest.advanceTimersByTime(60001);
      expect(mockSwUpdate.checkForUpdate).toHaveBeenCalled();
      jest.useRealTimers();
    });

    it('should prompt for reload when update is ready', () => {
      jest.spyOn(window, 'confirm').mockReturnValue(true);
      jest.spyOn(window.location, 'reload').mockImplementation();
      
      versionUpdatesSubject.next({ type: 'VERSION_READY' });
      
      expect(window.confirm).toHaveBeenCalledWith('New version available. Reload to update?');
      expect(window.location.reload).toHaveBeenCalled();
    });

    it('should log error on update failure', () => {
      jest.spyOn(console, 'error').mockImplementation();
      
      versionUpdatesSubject.next({ 
        type: 'VERSION_INSTALLATION_FAILED',
        error: 'Test error'
      });
      
      expect(console.error).toHaveBeenCalledWith('Failed to install app version:', 'Test error');
    });
  });

  describe('Service worker disabled', () => {
    it('should handle disabled service worker gracefully', () => {
      mockSwUpdate.isEnabled = false;
      service = TestBed.inject(InstallPromptService);
      expect(service.isServiceWorkerEnabled).toBeFalsy();
    });
  });
});