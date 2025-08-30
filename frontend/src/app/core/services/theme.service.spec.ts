import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';
import { A11yModule, HighContrastModeDetector } from '@angular/cdk/a11y';
import { PlatformModule } from '@angular/cdk/platform';
import { LayoutModule } from '@angular/cdk/layout';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ThemeService,
        {
          provide: HighContrastModeDetector,
          useValue: {
            _applyBodyHighContrastModeCssClasses: () => {},
          },
        },
      ],
    });
    service = TestBed.inject(ThemeService);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should default to dark mode', () => {
    expect(service.isDarkMode()).toBe(true);
  });

  it('should toggle theme', () => {
    const initialMode = service.isDarkMode();
    service.toggleTheme();
    expect(service.isDarkMode()).toBe(!initialMode);
  });

  it('should persist theme preference to localStorage', () => {
    service.toggleTheme();
    const stored = localStorage.getItem('theme');
    expect(stored).toBe(service.isDarkMode() ? 'dark' : 'light');
  });

  it('should apply theme class to body', () => {
    service.toggleTheme();
    const expectedClass = service.isDarkMode() ? 'dark-theme' : 'light-theme';
    expect(document.body.className).toContain(expectedClass);
  });

  it('should load saved theme preference', () => {
    localStorage.setItem('theme', 'light');
    // Re-create the service to simulate a new session
    const newService = TestBed.runInInjectionContext(() => new ThemeService());
    expect(newService.isDarkMode()).toBe(false);
  });
});