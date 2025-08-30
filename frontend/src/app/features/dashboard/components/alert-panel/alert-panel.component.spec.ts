import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AlertPanelComponent } from './alert-panel.component';
import { WeatherAlert, AlertSeverity } from '../alert-badge/alert-badge.component';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatExpansionPanelHarness } from '@angular/material/expansion/testing';

describe('AlertPanelComponent', () => {
  let component: AlertPanelComponent;
  let fixture: ComponentFixture<AlertPanelComponent>;
  let loader: HarnessLoader;

  const mockAlerts: WeatherAlert[] = [
    {
      id: 'alert-1',
      locationId: 'loc-1',
      alertType: AlertSeverity.WARNING,
      headline: 'Severe Thunderstorm Warning',
      description: 'Severe thunderstorms with damaging winds and large hail expected',
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
      description: 'Flash flooding possible in low-lying areas',
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
      description: 'Strong winds expected with gusts up to 45 mph',
      startTime: new Date('2025-08-30T08:00:00Z'),
      endTime: new Date('2025-08-30T20:00:00Z'),
      source: 'National Weather Service',
      isActive: true,
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertPanelComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(AlertPanelComponent);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not display accordion when no alerts', () => {
    component.alertList = [];
    fixture.detectChanges();
    
    const accordion = fixture.nativeElement.querySelector('.alert-accordion');
    expect(accordion).toBeNull();
  });

  it('should display accordion with panels for each alert', async () => {
    component.alertList = mockAlerts;
    fixture.detectChanges();
    
    const panels = await loader.getAllHarnesses(MatExpansionPanelHarness);
    expect(panels.length).toBe(3);
  });

  it('should auto-expand first warning alert', async () => {
    component.alertList = mockAlerts;
    fixture.detectChanges();
    
    const panels = await loader.getAllHarnesses(MatExpansionPanelHarness);
    const firstPanelExpanded = await panels[0].isExpanded();
    expect(firstPanelExpanded).toBe(true);
    
    const otherPanelsExpanded = await Promise.all([
      panels[1].isExpanded(),
      panels[2].isExpanded()
    ]);
    expect(otherPanelsExpanded).toEqual([false, false]);
  });

  it('should not auto-expand when no warnings', async () => {
    component.alertList = [mockAlerts[1], mockAlerts[2]];
    fixture.detectChanges();
    
    const panels = await loader.getAllHarnesses(MatExpansionPanelHarness);
    const expansionStates = await Promise.all(panels.map(p => p.isExpanded()));
    expect(expansionStates).toEqual([false, false]);
  });

  it('should display correct alert content', async () => {
    component.alertList = [mockAlerts[0]];
    fixture.detectChanges();
    
    const panel = await loader.getHarness(MatExpansionPanelHarness);
    const title = await panel.getTitle();
    const description = await panel.getDescription();
    
    expect(title).toContain('Severe Thunderstorm Warning');
    expect(description).toContain('WARNING');
  });

  it('should show correct icon for each severity', () => {
    expect(component.getAlertIcon(AlertSeverity.WARNING)).toBe('error');
    expect(component.getAlertIcon(AlertSeverity.WATCH)).toBe('warning');
    expect(component.getAlertIcon(AlertSeverity.ADVISORY)).toBe('info');
  });

  it('should show correct color for each severity', () => {
    expect(component.getAlertColor(AlertSeverity.WARNING)).toBe('#f44336');
    expect(component.getAlertColor(AlertSeverity.WATCH)).toBe('#ff9800');
    expect(component.getAlertColor(AlertSeverity.ADVISORY)).toBe('#2196f3');
  });

  it('should format time correctly', () => {
    const date = new Date('2025-08-30T14:30:00Z');
    const formatted = component.formatTime(date);
    expect(formatted).toMatch(/Aug 30.*PM/);
  });

  it('should format time from string', () => {
    const dateString = '2025-08-30T14:30:00Z';
    const formatted = component.formatTime(dateString);
    expect(formatted).toMatch(/Aug 30.*PM/);
  });

  it('should display alert metadata', async () => {
    component.alertList = [mockAlerts[0]];
    fixture.detectChanges();
    
    const panel = await loader.getHarness(MatExpansionPanelHarness);
    await panel.expand();
    
    const content = await panel.getTextContent();
    expect(content).toContain('National Weather Service');
    expect(content).toContain('Valid from');
  });

  it('should handle null alert list', () => {
    component.alertList = null as any;
    fixture.detectChanges();
    
    expect(component.hasAlerts()).toBe(false);
    const accordion = fixture.nativeElement.querySelector('.alert-accordion');
    expect(accordion).toBeNull();
  });

  it('should handle undefined alert list', () => {
    component.alertList = undefined as any;
    fixture.detectChanges();
    
    expect(component.hasAlerts()).toBe(false);
    const accordion = fixture.nativeElement.querySelector('.alert-accordion');
    expect(accordion).toBeNull();
  });

  it('should identify first warning correctly', () => {
    component.alertList = mockAlerts;
    fixture.detectChanges();
    
    expect(component.isFirstWarning(mockAlerts[0])).toBe(true);
    expect(component.isFirstWarning(mockAlerts[1])).toBe(false);
    expect(component.isFirstWarning(mockAlerts[2])).toBe(false);
  });

  it('should handle no warnings in isFirstWarning', () => {
    component.alertList = [mockAlerts[1], mockAlerts[2]];
    fixture.detectChanges();
    
    expect(component.isFirstWarning(mockAlerts[1])).toBe(false);
    expect(component.isFirstWarning(mockAlerts[2])).toBe(false);
  });
});