import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SearchComponent } from './search.component';
import { LocationService } from '../../core/services/location.service';
import { LocationSearchResult } from '@shared/models/location.model';
import { of, throwError } from 'rxjs';

describe('SearchComponent', () => {
  let component: SearchComponent;
  let fixture: ComponentFixture<SearchComponent>;
  let httpTestingController: HttpTestingController;
  let locationService: jest.Mocked<LocationService>;
  let router: jest.Mocked<Router>;
  let snackBar: jest.Mocked<MatSnackBar>;

  const mockSearchResults: LocationSearchResult[] = [
    { name: 'New York', country: 'US', state: 'New York', lat: 40.71, lon: -74.01 },
    { name: 'London', country: 'GB', lat: 51.51, lon: -0.13 }
  ];

  // Mock SpeechRecognition globally before all tests
  const originalWebkit = (window as any).webkitSpeechRecognition;
  const originalSpeech = (window as any).SpeechRecognition;

  beforeAll(() => {
    // Set up a default mock that does nothing
    (window as any).webkitSpeechRecognition = undefined;
    (window as any).SpeechRecognition = undefined;
  });

  afterAll(() => {
    // Restore original values
    (window as any).webkitSpeechRecognition = originalWebkit;
    (window as any).SpeechRecognition = originalSpeech;
  });

  beforeEach(async () => {
    const locationServiceSpy = {
      getLocations: jest.fn(),
      addLocation: jest.fn()
    };
    const routerSpy = {
      navigate: jest.fn()
    };
    const snackBarSpy = {
      open: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [
        SearchComponent,
        HttpClientTestingModule,
        NoopAnimationsModule,
        ReactiveFormsModule
      ],
      providers: [
        { provide: LocationService, useValue: locationServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SearchComponent);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
    locationService = TestBed.inject(LocationService) as jest.Mocked<LocationService>;
    router = TestBed.inject(Router) as jest.Mocked<Router>;
    snackBar = TestBed.inject(MatSnackBar) as jest.Mocked<MatSnackBar>;
    
    fixture.detectChanges();
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty search results', () => {
    expect(component.searchResults()).toEqual([]);
    expect(component.searchControl.value).toBe('');
  });

  it('should not search with less than 3 characters', fakeAsync(() => {
    component.searchControl.setValue('ab');
    tick(350);

    httpTestingController.expectNone('/api/search/location');
    expect(component.searchError()).toBe('Enter at least 3 characters');
  }));

  it('should perform search after debounce time', fakeAsync(() => {
    component.searchControl.setValue('New York');
    tick(350);

    const req = httpTestingController.expectOne('/api/search/location?q=New%20York');
    expect(req.request.method).toBe('GET');
    
    req.flush(mockSearchResults);
    
    expect(component.searchResults()).toEqual(mockSearchResults);
    expect(component.isSearching()).toBe(false);
  }));

  it('should handle search errors', fakeAsync(() => {
    component.searchControl.setValue('test');
    tick(350);

    const req = httpTestingController.expectOne('/api/search/location?q=test');
    req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    
    expect(component.searchError()).toBe('Failed to search locations. Please try again.');
    expect(component.searchResults()).toEqual([]);
  }));

  it('should add location when selected from autocomplete', fakeAsync(() => {
    locationService.getLocations.mockReturnValue(of([]));
    
    const location = mockSearchResults[0];
    const event = {
      option: { value: location }
    };

    component.onLocationSelected(event);
    tick();

    const req = httpTestingController.expectOne('/api/locations');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      name: location.name,
      latitude: location.lat,
      longitude: location.lon,
      country: location.country,
      state: location.state
    });

    req.flush({ id: '1', ...location });
    tick();

    expect(snackBar.open).toHaveBeenCalledWith(
      'New York added successfully',
      'Close',
      expect.objectContaining({ duration: 3000 })
    );
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  }));

  it('should show error when location limit is reached', fakeAsync(() => {
    const existingLocations = Array(5).fill({}).map((_, i) => ({
      id: String(i),
      name: `Location ${i}`,
      latitude: 0,
      longitude: 0,
      isPrimary: i === 0,
      order: i,
      createdAt: new Date(),
      settings: { alertsEnabled: true, units: 'imperial' as const }
    }));

    locationService.getLocations.mockReturnValue(of(existingLocations));
    
    const location = mockSearchResults[0];
    const event = {
      option: { value: location }
    };

    component.onLocationSelected(event);
    tick();

    expect(snackBar.open).toHaveBeenCalledWith(
      'Maximum number of locations (5) reached',
      'Close',
      expect.objectContaining({ duration: 5000 })
    );
  }));

  it('should clear search', () => {
    component.searchControl.setValue('test');
    component.searchResults.set(mockSearchResults);
    component.searchError.set('Some error');

    component.clearSearch();

    expect(component.searchControl.value).toBe('');
    expect(component.searchResults()).toEqual([]);
    expect(component.searchError()).toBeNull();
  });

  it('should add location on enter key when single result', fakeAsync(() => {
    locationService.getLocations.mockReturnValue(of([]));
    component.searchResults.set([mockSearchResults[0]]);

    component.onEnterKey();

    const req = httpTestingController.expectOne('/api/locations');
    expect(req.request.method).toBe('POST');
    req.flush({ id: '1', ...mockSearchResults[0] });

    expect(router.navigate).toHaveBeenCalledWith(['/']);
  }));

  it('should not add location on enter key with multiple results', () => {
    component.searchResults.set(mockSearchResults);
    component.onEnterKey();

    httpTestingController.expectNone('/api/locations');
  });

  it('should detect voice support correctly', () => {
    // Create a new component instance for each test to ensure proper initialization
    let testComponent: SearchComponent;
    let testFixture: ComponentFixture<SearchComponent>;

    // Test with webkitSpeechRecognition
    (window as any).webkitSpeechRecognition = class {
      start() {}
      stop() {}
    };
    delete (window as any).SpeechRecognition;
    testFixture = TestBed.createComponent(SearchComponent);
    testComponent = testFixture.componentInstance;
    testFixture.detectChanges();
    expect(testComponent.isVoiceSupported()).toBe(true);
    // Manually clean up recognition to avoid cleanup errors
    (testComponent as any).recognition = null;
    testFixture.destroy();

    // Test with SpeechRecognition
    delete (window as any).webkitSpeechRecognition;
    (window as any).SpeechRecognition = class {
      start() {}
      stop() {}
    };
    testFixture = TestBed.createComponent(SearchComponent);
    testComponent = testFixture.componentInstance;
    testFixture.detectChanges();
    expect(testComponent.isVoiceSupported()).toBe(true);
    // Manually clean up recognition to avoid cleanup errors
    (testComponent as any).recognition = null;
    testFixture.destroy();

    // Reset to default state
    delete (window as any).webkitSpeechRecognition;
    delete (window as any).SpeechRecognition;
  });

  it('should handle voice search when supported', () => {
    const mockRecognition = {
      start: jest.fn(),
      stop: jest.fn(),
      onstart: null as any,
      onresult: null as any,
      onerror: null as any,
      onend: null as any
    };

    (window as any).webkitSpeechRecognition = jest.fn().mockReturnValue(mockRecognition);
    
    // Re-initialize component to pick up the mock
    fixture = TestBed.createComponent(SearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.startVoiceSearch();
    expect(mockRecognition.start).toHaveBeenCalled();
  });

  it('should clean up on destroy', () => {
    const mockRecognition = { stop: jest.fn() };
    (component as any).recognition = mockRecognition;

    component.ngOnDestroy();
    
    expect(mockRecognition.stop).toHaveBeenCalled();
  });
});