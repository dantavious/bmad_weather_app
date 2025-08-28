import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DashboardComponent } from './dashboard.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { LocationService } from '../../core/services/location.service';
import { of } from 'rxjs';
import { WeatherLocation } from '@shared/models/location.model';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let mockLocationService: any;

  const mockLocations: WeatherLocation[] = [
    {
      id: '1',
      name: 'New York, NY',
      latitude: 40.7128,
      longitude: -74.0060,
      isPrimary: true,
      order: 0,
      createdAt: new Date(),
      settings: {
        alertsEnabled: true,
        units: 'imperial'
      }
    }
  ];

  beforeEach(async () => {
    mockLocationService = {
      fetchLocations: jest.fn().mockReturnValue(of(mockLocations)),
      locations$: of(mockLocations),
      loading$: of(false),
      error$: of(null)
    };

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideAnimationsAsync(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: LocationService, useValue: mockLocationService }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display weather dashboard title', () => {
    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1.textContent).toContain('Weather Dashboard');
  });

  it('should fetch locations on init', () => {
    expect(mockLocationService.fetchLocations).toHaveBeenCalled();
  });

  it('should display weather cards for locations', () => {
    component.locations.set(mockLocations);
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll('app-weather-card');
    expect(cards.length).toBe(1);
  });

  it('should show empty state when no locations', () => {
    component.locations.set([]);
    component.loading.set(false);
    fixture.detectChanges();
    const emptyState = fixture.nativeElement.querySelector('.empty-state');
    expect(emptyState).toBeTruthy();
    expect(emptyState.textContent).toContain('No Locations Added');
  });

  it('should show error state when error occurs', () => {
    component.error.set('Failed to load');
    fixture.detectChanges();
    const errorCard = fixture.nativeElement.querySelector('.error-card');
    expect(errorCard).toBeTruthy();
    expect(errorCard.textContent).toContain('Failed to load');
  });

  it('should limit locations to 5', () => {
    const manyLocations = Array(10).fill(mockLocations[0]).map((loc, i) => ({
      ...loc,
      id: `${i}`
    }));
    component.locations.set(manyLocations);
    expect(component.locations().length).toBeLessThanOrEqual(5);
  });
});