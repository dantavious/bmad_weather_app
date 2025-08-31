import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { OfflineIndicatorComponent } from './offline-indicator.component';
import { OfflineService } from '../../../core/services/offline.service';
import { signal } from '@angular/core';

describe('OfflineIndicatorComponent', () => {
  let component: OfflineIndicatorComponent;
  let fixture: ComponentFixture<OfflineIndicatorComponent>;
  let mockOfflineService: jasmine.SpyObj<OfflineService>;

  beforeEach(async () => {
    mockOfflineService = jasmine.createSpyObj('OfflineService', 
      ['checkConnectivity', 'getOfflineMessage'],
      {
        isOnline: signal(true),
        isOffline: signal(false),
        connectionStatus: signal('online'),
        offlineDuration: signal(null)
      }
    );
    mockOfflineService.getOfflineMessage.and.returnValue('You are currently offline');

    await TestBed.configureTestingModule({
      imports: [OfflineIndicatorComponent, BrowserAnimationsModule],
      providers: [
        { provide: OfflineService, useValue: mockOfflineService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OfflineIndicatorComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not display banner when online', () => {
    fixture.detectChanges();
    const banner = fixture.nativeElement.querySelector('.offline-banner');
    expect(banner).toBeNull();
  });

  it('should display banner when offline', () => {
    Object.defineProperty(mockOfflineService, 'isOffline', {
      value: signal(true)
    });
    fixture.detectChanges();
    
    const banner = fixture.nativeElement.querySelector('.offline-banner');
    expect(banner).toBeTruthy();
  });

  it('should display offline message', () => {
    Object.defineProperty(mockOfflineService, 'isOffline', {
      value: signal(true)
    });
    mockOfflineService.getOfflineMessage.and.returnValue('You have been offline for 5 minutes');
    fixture.detectChanges();
    
    const message = fixture.nativeElement.querySelector('.offline-message');
    expect(message.textContent).toBe('You have been offline for 5 minutes');
  });

  it('should display cloud_off icon when offline', () => {
    Object.defineProperty(mockOfflineService, 'isOffline', {
      value: signal(true)
    });
    fixture.detectChanges();
    
    const icon = fixture.nativeElement.querySelector('.offline-icon');
    expect(icon.textContent.trim()).toBe('cloud_off');
  });

  it('should display info message about limited features', () => {
    Object.defineProperty(mockOfflineService, 'isOffline', {
      value: signal(true)
    });
    fixture.detectChanges();
    
    const info = fixture.nativeElement.querySelector('.offline-info');
    expect(info.textContent).toBe('Some features may be limited');
  });

  it('should apply slide animation', () => {
    Object.defineProperty(mockOfflineService, 'isOffline', {
      value: signal(true)
    });
    fixture.detectChanges();
    
    const banner = fixture.nativeElement.querySelector('.offline-banner');
    expect(banner.getAttribute('ng-reflect-animation-state')).toBeDefined();
  });

  it('should update message when offline duration changes', () => {
    Object.defineProperty(mockOfflineService, 'isOffline', {
      value: signal(true)
    });
    mockOfflineService.getOfflineMessage.and.returnValue('You are currently offline');
    fixture.detectChanges();
    
    let message = fixture.nativeElement.querySelector('.offline-message');
    expect(message.textContent).toBe('You are currently offline');
    
    mockOfflineService.getOfflineMessage.and.returnValue('You have been offline for 1 hour');
    fixture.detectChanges();
    
    message = fixture.nativeElement.querySelector('.offline-message');
    expect(message.textContent).toBe('You have been offline for 1 hour');
  });

  it('should hide banner when connection is restored', () => {
    const isOfflineSignal = signal(true);
    Object.defineProperty(mockOfflineService, 'isOffline', {
      value: isOfflineSignal
    });
    fixture.detectChanges();
    
    let banner = fixture.nativeElement.querySelector('.offline-banner');
    expect(banner).toBeTruthy();
    
    isOfflineSignal.set(false);
    fixture.detectChanges();
    
    banner = fixture.nativeElement.querySelector('.offline-banner');
    expect(banner).toBeNull();
  });
});