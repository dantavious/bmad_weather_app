import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
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
    const newService = new ThemeService();
    expect(newService.isDarkMode()).toBe(false);
  });
});