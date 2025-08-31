import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { SolarCalculatorComponent } from './solar.component';
import { SolarService } from '../../core/services/solar.service';
import { LocationService } from '../../core/services/location.service';
import { SolarCalculationResult } from '../../../../../shared/models/solar.model';
import { WeatherLocation } from '../../../../../shared/models/location.model';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('SolarCalculatorComponent', () => {
  let component: SolarCalculatorComponent;
  let fixture: ComponentFixture<SolarCalculatorComponent>;
  let mockSolarService: jest.Mocked<SolarService>;
  let mockLocationService: any;

  const mockLocations: WeatherLocation[] = [
    {
      id: '1',
      name: 'New York',
      latitude: 40.7128,
      longitude: -74.0060,
      isPrimary: false,
      order: 0,
      createdAt: new Date(),
      settings: {
        alertsEnabled: true,
        units: 'imperial'
      }
    },
    {
      id: '2',
      name: 'Los Angeles',
      latitude: 34.0522,
      longitude: -118.2437,
      isPrimary: false,
      order: 1,
      createdAt: new Date(),
      settings: {
        alertsEnabled: true,
        units: 'imperial'
      }
    }
  ];

  const mockCalculationResult: SolarCalculationResult = {
    totalDailyKwh: 25.5,
    hourlyGeneration: [
      { hour: '06:00', kwh: 0.5, irradiance: 50 },
      { hour: '12:00', kwh: 4.5, irradiance: 850 },
      { hour: '18:00', kwh: 0.8, irradiance: 100 }
    ],
    peakHours: ['10:00', '11:00', '12:00', '13:00', '14:00'],
    cloudImpact: 15
  };

  beforeEach(async () => {
    mockSolarService = {
      calculateDailyGeneration: jest.fn()
    } as any;
    mockLocationService = {
      locations: signal(mockLocations)
    };

    await TestBed.configureTestingModule({
      imports: [SolarCalculatorComponent, NoopAnimationsModule],
      providers: [
        { provide: SolarService, useValue: mockSolarService },
        { provide: LocationService, useValue: mockLocationService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SolarCalculatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load saved locations from LocationService', () => {
    expect(component.savedLocations()).toEqual(mockLocations);
  });

  it('should calculate solar generation successfully', async () => {
    mockSolarService.calculateDailyGeneration.mockResolvedValue(mockCalculationResult);

    const panelConfig = {
      panel: { wattage: 400, quantity: 10, efficiency: 85 },
      locationId: '1'
    };

    await component.onCalculate(panelConfig);

    expect(mockSolarService.calculateDailyGeneration).toHaveBeenCalledWith(
      panelConfig.panel,
      40.7128,
      -74.0060
    );
    expect(component.calculationResult()).toEqual(mockCalculationResult);
    expect(component.error()).toBeNull();
    expect(component.calculating()).toBeFalse();
  });

  it('should handle calculation errors', async () => {
    const errorMessage = 'Calculation failed';
    mockSolarService.calculateDailyGeneration.mockRejectedValue(new Error(errorMessage));

    const panelConfig = {
      panel: { wattage: 400, quantity: 10, efficiency: 85 },
      locationId: '1'
    };

    await component.onCalculate(panelConfig);

    expect(component.error()).toBe(errorMessage);
    expect(component.calculationResult()).toBeNull();
    expect(component.calculating()).toBeFalse();
  });

  it('should handle missing location error', async () => {
    const panelConfig = {
      panel: { wattage: 400, quantity: 10, efficiency: 85 },
      locationId: 'invalid'
    };

    await component.onCalculate(panelConfig);

    expect(component.error()).toBe('Selected location not found');
    expect(mockSolarService.calculateDailyGeneration).not.toHaveBeenCalled();
    expect(component.calculating()).toBeFalse();
  });

  it('should reset state when starting new calculation', async () => {
    component.error.set('Previous error');
    component.calculationResult.set(mockCalculationResult);

    mockSolarService.calculateDailyGeneration.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockCalculationResult), 100))
    );

    const panelConfig = {
      panel: { wattage: 400, quantity: 10, efficiency: 85 },
      locationId: '1'
    };

    const promise = component.onCalculate(panelConfig);
    
    expect(component.calculating()).toBeTrue();
    expect(component.error()).toBeNull();
    expect(component.calculationResult()).toBeNull();

    await promise;
  });
});