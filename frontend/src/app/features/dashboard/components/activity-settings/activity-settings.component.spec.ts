import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivitySettingsComponent } from './activity-settings.component';
import { SettingsService } from '../../../../core/services/settings.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivityType } from '../../../../../../../shared/models/activity.model';
import { signal } from '@angular/core';

describe('ActivitySettingsComponent', () => {
  let component: ActivitySettingsComponent;
  let fixture: ComponentFixture<ActivitySettingsComponent>;
  let mockSettingsService: jest.Mocked<SettingsService>;
  let mockSnackBar: jest.Mocked<MatSnackBar>;

  beforeEach(async () => {
    mockSettingsService = {
      getActivitySettings: jest.fn(),
      updateActivitySettings: jest.fn(),
      getSettings: jest.fn(),
      updateSettings: jest.fn(),
      getUnitPreference: jest.fn(),
      updateUnitPreference: jest.fn()
    } as any;
    
    mockSnackBar = {
      open: jest.fn().mockReturnValue({
        afterDismissed: jest.fn().mockReturnValue({ subscribe: jest.fn() })
      })
    } as any;
    
    mockSettingsService.getActivitySettings.mockReturnValue({
      showActivities: true,
      showBestHours: true,
      enabledActivities: [ActivityType.RUNNING, ActivityType.CYCLING],
      customThresholds: undefined
    });

    await TestBed.configureTestingModule({
      imports: [
        ActivitySettingsComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: SettingsService, useValue: mockSettingsService },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ActivitySettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load current settings on initialization', () => {
    expect(component.showActivities()).toBe(true);
    expect(component.showBestHours()).toBe(true);
    expect(component.enabledActivities()).toContain(ActivityType.RUNNING);
    expect(component.enabledActivities()).toContain(ActivityType.CYCLING);
  });

  it('should display all five activities', () => {
    const activities = component.activities();
    expect(activities.length).toBe(5);
    expect(activities.map(a => a.type)).toContain(ActivityType.RUNNING);
    expect(activities.map(a => a.type)).toContain(ActivityType.CYCLING);
    expect(activities.map(a => a.type)).toContain(ActivityType.GARDENING);
    expect(activities.map(a => a.type)).toContain(ActivityType.OUTDOOR_WORK);
    expect(activities.map(a => a.type)).toContain(ActivityType.STARGAZING);
  });

  it('should toggle show activities setting', () => {
    component.toggleShowActivities(false);
    expect(component.showActivities()).toBe(false);
    
    component.toggleShowActivities(true);
    expect(component.showActivities()).toBe(true);
  });

  it('should toggle show best hours setting', () => {
    component.toggleShowBestHours(false);
    expect(component.showBestHours()).toBe(false);
    
    component.toggleShowBestHours(true);
    expect(component.showBestHours()).toBe(true);
  });

  it('should toggle individual activity', () => {
    const initialState = component.activities().find(a => a.type === ActivityType.GARDENING)?.enabled;
    
    component.toggleActivity(ActivityType.GARDENING, !initialState);
    
    const updatedActivity = component.activities().find(a => a.type === ActivityType.GARDENING);
    expect(updatedActivity?.enabled).toBe(!initialState);
  });

  it('should enforce minimum one activity selected', () => {
    // Start with 2 activities enabled
    expect(component.hasMinimumActivities()).toBe(true);
    
    // Disable one activity
    component.toggleActivity(ActivityType.CYCLING, false);
    
    // Should still allow disabling since one remains
    expect(component.hasMinimumActivities()).toBe(false);
  });

  it('should save settings correctly', () => {
    component.toggleShowActivities(false);
    component.toggleShowBestHours(false);
    component.toggleActivity(ActivityType.GARDENING, true);
    
    component.saveSettings();
    
    expect(mockSettingsService.updateActivitySettings).toHaveBeenCalledWith({
      showActivities: false,
      showBestHours: false,
      enabledActivities: [ActivityType.RUNNING, ActivityType.CYCLING, ActivityType.GARDENING],
      customThresholds: undefined
    });
    
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Activity settings saved',
      'Close',
      expect.objectContaining({
        duration: 3000
      })
    );
  });

  it('should reset to default settings', () => {
    // Modify settings
    component.toggleShowActivities(false);
    component.toggleShowBestHours(false);
    component.activities.update(activities =>
      activities.map(a => ({ ...a, enabled: false }))
    );
    
    // Reset
    component.resetToDefaults();
    
    expect(component.showActivities()).toBe(true);
    expect(component.showBestHours()).toBe(true);
    
    const enabledActivities = component.enabledActivities();
    expect(enabledActivities).toContain(ActivityType.RUNNING);
    expect(enabledActivities).toContain(ActivityType.CYCLING);
    expect(enabledActivities).toContain(ActivityType.GARDENING);
    expect(enabledActivities.length).toBe(3);
    
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Settings reset to defaults',
      'Close',
      expect.objectContaining({
        duration: 3000
      })
    );
  });

  it('should render activity icons correctly', () => {
    const element: HTMLElement = fixture.nativeElement;
    const activityIcons = element.querySelectorAll('.activity-header mat-icon');
    
    expect(activityIcons.length).toBeGreaterThan(0);
  });

  it('should show warning when minimum activities not met', () => {
    // Disable all but one activity
    component.activities.update(activities =>
      activities.map((a, index) => ({ ...a, enabled: index === 0 }))
    );
    fixture.detectChanges();
    
    expect(component.hasMinimumActivities()).toBe(false);
    
    const element: HTMLElement = fixture.nativeElement;
    const warning = element.querySelector('.warning-message');
    expect(warning?.textContent).toContain('At least one activity must be selected');
  });

  it('should handle null settings gracefully', () => {
    // Create a new mock for this test
    const nullSettingsService = {
      getActivitySettings: jest.fn().mockReturnValue(null),
      updateActivitySettings: jest.fn(),
      getSettings: jest.fn(),
      updateSettings: jest.fn(),
      getUnitPreference: jest.fn(),
      updateUnitPreference: jest.fn()
    } as any;
    
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [
        ActivitySettingsComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: SettingsService, useValue: nullSettingsService },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ]
    });
    
    const newFixture = TestBed.createComponent(ActivitySettingsComponent);
    const newComponent = newFixture.componentInstance;
    
    expect(newComponent.showActivities()).toBe(true);
    expect(newComponent.showBestHours()).toBe(true);
    expect(newComponent.enabledActivities().length).toBeGreaterThan(0);
  });
});