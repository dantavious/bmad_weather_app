import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DashboardComponent } from './dashboard.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { LocationService } from '../../core/services/location.service';
import { of } from 'rxjs';
import { WeatherLocation } from '@shared/models/location.model';
import { importProvidersFrom } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { A11yModule } from '@angular/cdk/a11y';
import { PlatformModule } from '@angular/cdk/platform';
import { LayoutModule } from '@angular/cdk/layout';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let mockLocationService: any;
  let mockSnackBar: jest.Mocked<MatSnackBar>;
  let mockDialog: jest.Mocked<MatDialog>;

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
    },
    {
      id: '2',
      name: 'Los Angeles, CA',
      latitude: 34.0522,
      longitude: -118.2437,
      isPrimary: false,
      order: 1,
      createdAt: new Date(),
      settings: {
        alertsEnabled: false,
        units: 'imperial'
      }
    }
  ];

  beforeEach(async () => {
    mockLocationService = {
      fetchLocations: jest.fn().mockReturnValue(of(mockLocations)),
      locations$: of(mockLocations),
      loading$: of(false),
      error$: of(null),
      reorderLocations: jest.fn(),
      setPrimaryLocation: jest.fn(),
      deleteLocation: jest.fn().mockReturnValue(of(true)),
      addLocation: jest.fn().mockReturnValue(of(mockLocations[0])),
      updateLocationName: jest.fn()
    };
    
    mockSnackBar = {
      open: jest.fn()
    } as any;
    mockDialog = {
      open: jest.fn()
    } as any;

    await TestBed.configureTestingModule({
      imports: [DashboardComponent, NoopAnimationsModule],
      providers: [
        provideAnimationsAsync(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: LocationService, useValue: mockLocationService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: MatDialog, useValue: mockDialog },
        importProvidersFrom(
          MatDialogModule,
          A11yModule,
          PlatformModule,
          LayoutModule
        ),
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
    expect(cards.length).toBe(2);
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
    
    // This test is tricky because the component gets the sliced array.
    // We'll test the service subscription instead.
    mockLocationService.locations$ = of(manyLocations);
    component['subscribeToLocationUpdates']();
    fixture.detectChanges();
    
    expect(component.locations().length).toBe(5);
  });

  describe('drag and drop', () => {
    it('should reorder locations on drop', () => {
      component.locations.set(mockLocations);
      
      component.draggedIndex = 0;
      component.dragOverIndex = 1;
      
      const event = new DragEvent('drop');
      Object.defineProperty(event, 'preventDefault', { value: jest.fn() });
      component.onDrop(event);
      
      expect(mockLocationService.reorderLocations).toHaveBeenCalledWith(0, 1);
      expect(component.locations()[0].name).toBe('Los Angeles, CA');
      expect(component.locations()[1].name).toBe('New York, NY');
    });

    it('should not reorder if dropped at same position', () => {
      component.locations.set(mockLocations);
      
      component.draggedIndex = 0;
      component.dragOverIndex = 0;
      
      const event = new DragEvent('drop');
      Object.defineProperty(event, 'preventDefault', { value: jest.fn() });
      component.onDrop(event);
      
      expect(mockLocationService.reorderLocations).not.toHaveBeenCalled();
    });
  });

  describe('edit mode', () => {
    it('should toggle edit mode for a location', () => {
      component.locations.set(mockLocations);
      
      expect(component.isEditing('1')).toBe(false);
      
      component.toggleEdit('1');
      expect(component.isEditing('1')).toBe(true);
      expect(component.editingName).toBe('New York, NY');
    });

    it('should save location name when changed', () => {
      component.locations.set(mockLocations);
      component.editingStates.set('1', true);
      component.editingName = 'New York City';
      
      component.saveLocationName('1');
      
      expect(mockLocationService.updateLocationName).toHaveBeenCalledWith('1', 'New York City');
      expect(component.isEditing('1')).toBe(false);
    });
  });

  describe('primary location', () => {
    it('should set location as primary', () => {
      component.togglePrimary('2');
      
      expect(mockLocationService.setPrimaryLocation).toHaveBeenCalledWith('2');
    });
  });

  describe('delete location', () => {
    it('should show confirmation dialog before delete', () => {
      const dialogRef = {
        afterClosed: jest.fn().mockReturnValue(of(false))
      };
      mockDialog.open.mockReturnValue(dialogRef as any);
      
      component.deleteLocation(mockLocations[0]);
      
      expect(mockDialog.open).toHaveBeenCalled();
      expect(mockLocationService.deleteLocation).not.toHaveBeenCalled();
    });

    it('should delete location after confirmation', () => {
      const dialogRef = {
        afterClosed: jest.fn().mockReturnValue(of(true))
      };
      mockDialog.open.mockReturnValue(dialogRef as any);
      
      component.deleteLocation(mockLocations[0]);
      
      expect(mockLocationService.deleteLocation).toHaveBeenCalledWith('1');
    });
  });
});
