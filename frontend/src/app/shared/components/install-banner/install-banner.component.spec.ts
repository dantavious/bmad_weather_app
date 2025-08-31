import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { InstallBannerComponent } from './install-banner.component';
import { InstallPromptService } from '../../../core/services/install-prompt.service';
import { signal } from '@angular/core';

describe('InstallBannerComponent', () => {
  let component: InstallBannerComponent;
  let fixture: ComponentFixture<InstallBannerComponent>;
  let mockInstallPromptService: jasmine.SpyObj<InstallPromptService>;

  beforeEach(async () => {
    mockInstallPromptService = jasmine.createSpyObj('InstallPromptService', 
      ['showInstallPrompt', 'dismissInstallPrompt'],
      {
        canInstall: signal(false),
        isInstalled: signal(false),
        isServiceWorkerEnabled: true
      }
    );

    await TestBed.configureTestingModule({
      imports: [InstallBannerComponent, BrowserAnimationsModule],
      providers: [
        { provide: InstallPromptService, useValue: mockInstallPromptService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(InstallBannerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not display banner when canInstall is false', () => {
    fixture.detectChanges();
    const banner = fixture.nativeElement.querySelector('.install-banner');
    expect(banner).toBeNull();
  });

  it('should display banner when canInstall is true', () => {
    Object.defineProperty(mockInstallPromptService, 'canInstall', {
      value: signal(true)
    });
    fixture.detectChanges();
    
    const banner = fixture.nativeElement.querySelector('.install-banner');
    expect(banner).toBeTruthy();
  });

  it('should show correct title and subtitle', () => {
    Object.defineProperty(mockInstallPromptService, 'canInstall', {
      value: signal(true)
    });
    fixture.detectChanges();
    
    const title = fixture.nativeElement.querySelector('.install-title');
    const subtitle = fixture.nativeElement.querySelector('.install-subtitle');
    
    expect(title.textContent).toBe('Install BMad Weather');
    expect(subtitle.textContent).toBe('Add to your home screen for quick access');
  });

  it('should call showInstallPrompt when Install button is clicked', async () => {
    Object.defineProperty(mockInstallPromptService, 'canInstall', {
      value: signal(true)
    });
    mockInstallPromptService.showInstallPrompt.and.returnValue(Promise.resolve());
    fixture.detectChanges();
    
    const installButton = fixture.nativeElement.querySelector('button[color="primary"]');
    installButton.click();
    
    expect(mockInstallPromptService.showInstallPrompt).toHaveBeenCalled();
  });

  it('should call dismissInstallPrompt when Not Now button is clicked', () => {
    Object.defineProperty(mockInstallPromptService, 'canInstall', {
      value: signal(true)
    });
    fixture.detectChanges();
    
    const dismissButton = fixture.nativeElement.querySelector('button[mat-button]');
    dismissButton.click();
    
    expect(mockInstallPromptService.dismissInstallPrompt).toHaveBeenCalled();
  });

  it('should have proper Material Design icon', () => {
    Object.defineProperty(mockInstallPromptService, 'canInstall', {
      value: signal(true)
    });
    fixture.detectChanges();
    
    const icon = fixture.nativeElement.querySelector('.install-icon');
    expect(icon.textContent.trim()).toBe('install_mobile');
  });

  it('should apply slide animation', () => {
    Object.defineProperty(mockInstallPromptService, 'canInstall', {
      value: signal(true)
    });
    fixture.detectChanges();
    
    const banner = fixture.nativeElement.querySelector('.install-banner');
    expect(banner.getAttribute('ng-reflect-animation-state')).toBeDefined();
  });
});