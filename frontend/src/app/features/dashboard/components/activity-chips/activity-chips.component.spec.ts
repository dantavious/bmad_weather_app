import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivityChipsComponent } from './activity-chips.component';
import { 
  ActivityType, 
  Rating, 
  ActivityRecommendation,
  ActivitySettings 
} from '../../../../../../../shared/models/activity.model';

describe('ActivityChipsComponent', () => {
  let component: ActivityChipsComponent;
  let fixture: ComponentFixture<ActivityChipsComponent>;

  const mockRecommendations: ActivityRecommendation[] = [
    {
      activityType: ActivityType.RUNNING,
      rating: Rating.GOOD,
      score: 85,
      bestHours: ['06:00', '07:00'],
      factors: {
        temperature: Rating.GOOD,
        wind: Rating.GOOD,
        precipitation: Rating.GOOD,
        humidity: Rating.FAIR,
      }
    },
    {
      activityType: ActivityType.CYCLING,
      rating: Rating.FAIR,
      score: 60,
      bestHours: ['08:00'],
      factors: {
        temperature: Rating.GOOD,
        wind: Rating.FAIR,
        precipitation: Rating.GOOD,
        humidity: Rating.FAIR,
      }
    },
    {
      activityType: ActivityType.GARDENING,
      rating: Rating.POOR,
      score: 30,
      bestHours: [],
      factors: {
        temperature: Rating.POOR,
        wind: Rating.POOR,
        precipitation: Rating.POOR,
        humidity: Rating.POOR,
      }
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityChipsComponent, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(ActivityChipsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display all recommendations when no settings provided', () => {
    component.recommendations = mockRecommendations;
    fixture.detectChanges();

    const chips = fixture.nativeElement.querySelectorAll('mat-chip');
    expect(chips.length).toBe(3);
  });

  it('should filter recommendations based on enabled activities', () => {
    const settings: ActivitySettings = {
      enabledActivities: [ActivityType.RUNNING, ActivityType.CYCLING],
      showBestHours: true
    };

    component.recommendations = mockRecommendations;
    component.settings = settings;
    fixture.detectChanges();

    const filteredRecs = component.filteredRecommendations();
    expect(filteredRecs.length).toBe(2);
    expect(filteredRecs.map(r => r.activityType)).toEqual([
      ActivityType.RUNNING,
      ActivityType.CYCLING
    ]);
  });

  it('should apply correct CSS classes based on rating', () => {
    component.recommendations = mockRecommendations;
    fixture.detectChanges();

    const chips = fixture.nativeElement.querySelectorAll('mat-chip');
    expect(chips[0].classList.contains('good-rating')).toBe(true);
    expect(chips[1].classList.contains('fair-rating')).toBe(true);
    expect(chips[2].classList.contains('poor-rating')).toBe(true);
  });

  it('should emit activitySelected event when chip is clicked', () => {
    const selectedActivity = mockRecommendations[0];
    let emittedActivity: ActivityRecommendation | undefined;

    component.recommendations = mockRecommendations;
    component.activitySelected.subscribe((activity) => {
      emittedActivity = activity;
    });

    fixture.detectChanges();
    const firstChip = fixture.nativeElement.querySelector('mat-chip');
    firstChip.click();

    expect(emittedActivity).toEqual(selectedActivity);
  });

  it('should display correct icons for each activity type', () => {
    expect(component.getActivityIcon(ActivityType.RUNNING)).toBe('directions_run');
    expect(component.getActivityIcon(ActivityType.CYCLING)).toBe('directions_bike');
    expect(component.getActivityIcon(ActivityType.GARDENING)).toBe('local_florist');
    expect(component.getActivityIcon(ActivityType.OUTDOOR_WORK)).toBe('construction');
    expect(component.getActivityIcon(ActivityType.STARGAZING)).toBe('nights_stay');
  });

  it('should format activity names correctly', () => {
    expect(component.formatActivityName(ActivityType.RUNNING)).toBe('Running');
    expect(component.formatActivityName(ActivityType.CYCLING)).toBe('Cycling');
    expect(component.formatActivityName(ActivityType.GARDENING)).toBe('Gardening');
    expect(component.formatActivityName(ActivityType.OUTDOOR_WORK)).toBe('Outdoor Work');
    expect(component.formatActivityName(ActivityType.STARGAZING)).toBe('Stargazing');
  });

  it('should format ratings correctly', () => {
    expect(component.formatRating(Rating.GOOD)).toBe('✓ Good');
    expect(component.formatRating(Rating.FAIR)).toBe('~ Fair');
    expect(component.formatRating(Rating.POOR)).toBe('✗ Poor');
  });

  it('should generate correct accessibility labels', () => {
    const activity = mockRecommendations[0];
    const label = component.getActivityLabel(activity);
    expect(label).toBe('Running - ✓ Good conditions');
  });

  it('should handle empty recommendations array', () => {
    component.recommendations = [];
    fixture.detectChanges();

    const chipSet = fixture.nativeElement.querySelector('mat-chip-set');
    expect(chipSet).toBeNull();
  });

  it('should show all activities when enabledActivities is empty', () => {
    const settings: ActivitySettings = {
      enabledActivities: [],
      showBestHours: true
    };

    component.recommendations = mockRecommendations;
    component.settings = settings;
    fixture.detectChanges();

    const filteredRecs = component.filteredRecommendations();
    expect(filteredRecs.length).toBe(3);
  });
});