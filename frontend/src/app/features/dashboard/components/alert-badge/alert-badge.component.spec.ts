import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AlertBadgeComponent, WeatherAlert, AlertSeverity } from './alert-badge.component';

describe('AlertBadgeComponent', () => {
  let component: AlertBadgeComponent;
  let fixture: ComponentFixture<AlertBadgeComponent>;

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
    {
      id: 'alert-3',
      locationId: 'loc-1',
      alertType: AlertSeverity.ADVISORY,
      headline: 'Wind Advisory',
      description: 'Strong winds expected',
      startTime: new Date('2025-08-30T08:00:00Z'),
      endTime: new Date('2025-08-30T20:00:00Z'),
      source: 'National Weather Service',
      isActive: true,
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertBadgeComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(AlertBadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not display badge when no alerts', () => {
    component.alerts = [];
    fixture.detectChanges();
    
    const badgeButton = fixture.nativeElement.querySelector('.alert-badge-button');
    expect(badgeButton).toBeNull();
  });

  it('should display badge when alerts present', () => {
    component.alerts = mockAlerts;
    fixture.detectChanges();
    
    const badgeButton = fixture.nativeElement.querySelector('.alert-badge-button');
    expect(badgeButton).toBeTruthy();
  });

  it('should show correct alert count', () => {
    component.alerts = mockAlerts;
    fixture.detectChanges();
    
    expect(component.alertCount()).toBe('3');
  });

  it('should show 9+ for more than 9 alerts', () => {
    const manyAlerts = Array(15).fill(mockAlerts[0]).map((a, i) => ({...a, id: `alert-${i}`}));
    component.alerts = manyAlerts;
    fixture.detectChanges();
    
    expect(component.alertCount()).toBe('9+');
  });

  it('should prioritize WARNING severity for badge color', () => {
    component.alerts = mockAlerts;
    fixture.detectChanges();
    
    expect(component.highestSeverity()).toBe(AlertSeverity.WARNING);
    expect(component.getBadgeColor()).toBe('warn');
    expect(component.getIconColor()).toBe('#f44336');
  });

  it('should show WATCH severity when no WARNING', () => {
    component.alerts = [mockAlerts[1], mockAlerts[2]];
    fixture.detectChanges();
    
    expect(component.highestSeverity()).toBe(AlertSeverity.WATCH);
    expect(component.getBadgeColor()).toBe('accent');
    expect(component.getIconColor()).toBe('#ff9800');
  });

  it('should show ADVISORY severity when only advisories', () => {
    component.alerts = [mockAlerts[2]];
    fixture.detectChanges();
    
    expect(component.highestSeverity()).toBe(AlertSeverity.ADVISORY);
    expect(component.getBadgeColor()).toBe('primary');
    expect(component.getIconColor()).toBe('#2196f3');
  });

  it('should generate appropriate tooltip text for single alert', () => {
    component.alerts = [mockAlerts[0]];
    fixture.detectChanges();
    
    expect(component.getTooltipText()).toBe('Severe Thunderstorm Warning');
  });

  it('should generate appropriate tooltip text for multiple alerts', () => {
    component.alerts = mockAlerts;
    fixture.detectChanges();
    
    expect(component.getTooltipText()).toBe('3 active Warnings. Click for details.');
  });

  it('should emit custom event on click', (done) => {
    component.alerts = mockAlerts;
    fixture.detectChanges();
    
    const handler = (event: any) => {
      expect(event.detail.alerts).toEqual(mockAlerts);
      document.removeEventListener('alertClick', handler);
      done();
    };
    
    document.addEventListener('alertClick', handler);
    
    const badgeButton = fixture.nativeElement.querySelector('.alert-badge-button');
    badgeButton.click();
  });

  it('should handle null alerts input', () => {
    component.alerts = null as any;
    fixture.detectChanges();
    
    expect(component.hasAlerts()).toBe(false);
    expect(component.alertCount()).toBe('0');
  });

  it('should handle undefined alerts input', () => {
    component.alerts = undefined as any;
    fixture.detectChanges();
    
    expect(component.hasAlerts()).toBe(false);
    expect(component.alertCount()).toBe('0');
  });
});