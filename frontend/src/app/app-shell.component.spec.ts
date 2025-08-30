import { TestBed, ComponentFixture } from '@angular/core/testing';
import { AppShellComponent } from './app-shell.component';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';
import { ThemeService } from './core/services/theme.service';
import { LoadingService } from './core/services/loading.service';
import { signal } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { of } from 'rxjs';
import { provideCdkPlatform } from './core/providers/cdk-providers';

describe('AppShellComponent', () => {
  let component: AppShellComponent;
  let fixture: ComponentFixture<AppShellComponent>;
  let mockThemeService: Partial<ThemeService>;
  let mockLoadingService: Partial<LoadingService>;

  beforeEach(async () => {
    mockThemeService = {
      isDarkMode: signal(true),
      toggleTheme: jest.fn()
    };
    
    mockLoadingService = {
      isLoading: signal(false),
      show: jest.fn(),
      hide: jest.fn()
    };
    
    const mockBreakpointObserver = {
      observe: jest.fn().mockReturnValue(of({ matches: false }))
    };

    await TestBed.configureTestingModule({
      imports: [AppShellComponent],
      providers: [
        provideRouter([]),
        provideAnimationsAsync(),
        provideHttpClient(),
        { provide: ThemeService, useValue: mockThemeService },
        { provide: LoadingService, useValue: mockLoadingService },
        { provide: BreakpointObserver, useValue: mockBreakpointObserver },
        ...provideCdkPlatform()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle theme when button clicked', () => {
    const button = fixture.nativeElement.querySelector('[data-testid="theme-toggle"]');
    button.click();
    expect(mockThemeService.toggleTheme).toHaveBeenCalled();
  });

  it('should display app title', () => {
    const toolbar = fixture.nativeElement.querySelector('mat-toolbar span');
    expect(toolbar.textContent).toContain('DatDude Weather');
  });

  it('should show loading bar when loading', () => {
    (mockLoadingService.isLoading as any).set(true);
    fixture.detectChanges();
    const progressBar = fixture.nativeElement.querySelector('mat-progress-bar');
    expect(progressBar).toBeTruthy();
  });

  it('should hide loading bar when not loading', () => {
    (mockLoadingService.isLoading as any).set(false);
    fixture.detectChanges();
    const progressBar = fixture.nativeElement.querySelector('mat-progress-bar');
    expect(progressBar).toBeFalsy();
  });
});