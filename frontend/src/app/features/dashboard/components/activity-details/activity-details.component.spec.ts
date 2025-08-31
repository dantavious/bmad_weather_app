import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivityDetailsComponent } from './activity-details.component';
import { ActivityRecommendation, ActivityType, Rating } from '../../../../../../../shared/models/activity.model';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

describe('ActivityDetailsComponent', () => {
  let component: ActivityDetailsComponent;
  let fixture: ComponentFixture<ActivityDetailsComponent>;

  const mockRecommendation: ActivityRecommendation = {
    activityType: ActivityType.RUNNING,
    rating: Rating.GOOD,
    score: 85,
    bestHours: ['06:00', '07:00', '08:00'],
    factors: {
      temperature: Rating.GOOD,
      wind: Rating.FAIR,
      precipitation: Rating.GOOD,
      humidity: Rating.FAIR,
      aqi: Rating.GOOD
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ActivityDetailsComponent,
        NoopAnimationsModule,
        MatExpansionModule,
        MatChipsModule,
        MatIconModule,
        MatTooltipModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ActivityDetailsComponent);
    component = fixture.componentInstance;
    component.inputRecommendation = mockRecommendation;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display activity type with correct icon', () => {
    const icon = component.getActivityIcon(ActivityType.RUNNING);
    expect(icon).toBe('directions_run');
  });

  it('should display activity label correctly', () => {
    const label = component.getActivityLabel(ActivityType.CYCLING);
    expect(label).toBe('Cycling');
  });

  it('should display overall rating', () => {
    const element: HTMLElement = fixture.nativeElement;
    const ratingChip = element.querySelector('.rating-chip');
    expect(ratingChip?.textContent?.trim()).toBe('good');
  });

  it('should display best hours when available', () => {
    const element: HTMLElement = fixture.nativeElement;
    const bestHoursSection = element.querySelector('.best-hours-section');
    expect(bestHoursSection).toBeTruthy();
    
    const hourChips = element.querySelectorAll('.best-hour-chip');
    expect(hourChips.length).toBe(3);
  });

  it('should not display best hours section when empty', () => {
    component.inputRecommendation = {
      ...mockRecommendation,
      bestHours: []
    };
    fixture.detectChanges();
    
    const element: HTMLElement = fixture.nativeElement;
    const bestHoursSection = element.querySelector('.best-hours-section');
    expect(bestHoursSection).toBeFalsy();
  });

  it('should display all weather factors', () => {
    const factors = component.getFactors();
    expect(factors.length).toBe(5);
    expect(factors.map(f => f.name)).toContain('temperature');
    expect(factors.map(f => f.name)).toContain('wind');
    expect(factors.map(f => f.name)).toContain('precipitation');
    expect(factors.map(f => f.name)).toContain('humidity');
    expect(factors.map(f => f.name)).toContain('aqi');
  });

  it('should get correct factor icon', () => {
    expect(component.getFactorIcon('temperature')).toBe('thermostat');
    expect(component.getFactorIcon('wind')).toBe('air');
    expect(component.getFactorIcon('precipitation')).toBe('water_drop');
  });

  it('should get correct rating class', () => {
    expect(component.getRatingClass(Rating.GOOD)).toBe('good-rating');
    expect(component.getRatingClass(Rating.FAIR)).toBe('fair-rating');
    expect(component.getRatingClass(Rating.POOR)).toBe('poor-rating');
  });

  it('should provide factor explanations', () => {
    const explanation = component.getFactorExplanation(
      ActivityType.RUNNING,
      'temperature',
      Rating.GOOD
    );
    expect(explanation).toBe('Temperature is ideal for this activity');
  });

  it('should calculate score description correctly', () => {
    expect(component.getScoreDescription(85)).toBe('Excellent conditions for this activity');
    expect(component.getScoreDescription(65)).toBe('Good conditions with minor considerations');
    expect(component.getScoreDescription(45)).toBe('Fair conditions - check specific factors');
    expect(component.getScoreDescription(25)).toBe('Poor conditions - consider alternatives');
    expect(component.getScoreDescription(10)).toBe('Not recommended at this time');
  });

  it('should handle expansion state', () => {
    expect(component.expanded()).toBe(false);
    
    component.onExpandedChange(true);
    expect(component.expanded()).toBe(true);
    
    component.onExpandedChange(false);
    expect(component.expanded()).toBe(false);
  });

  it('should display overall score', () => {
    const element: HTMLElement = fixture.nativeElement;
    const scoreValue = element.querySelector('.score-value');
    expect(scoreValue?.textContent).toBe('85/100');
  });

  it('should handle missing AQI data', () => {
    component.inputRecommendation = {
      ...mockRecommendation,
      factors: {
        temperature: Rating.GOOD,
        wind: Rating.FAIR,
        precipitation: Rating.GOOD,
        humidity: Rating.FAIR
      }
    };
    fixture.detectChanges();
    
    const factors = component.getFactors();
    expect(factors.length).toBe(4);
    expect(factors.map(f => f.name)).not.toContain('aqi');
  });

  it('should apply correct CSS classes for ratings', () => {
    const element: HTMLElement = fixture.nativeElement;
    component.inputRecommendation = {
      ...mockRecommendation,
      rating: Rating.POOR
    };
    fixture.detectChanges();
    
    const ratingChip = element.querySelector('.rating-chip');
    expect(ratingChip?.classList.contains('poor-rating')).toBe(true);
  });
});