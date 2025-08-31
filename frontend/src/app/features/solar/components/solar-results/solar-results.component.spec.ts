import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SolarResultsComponent } from './solar-results.component';
import { SolarCalculationResult } from '../../../../../../../shared/models/solar.model';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('SolarResultsComponent', () => {
  let component: SolarResultsComponent;
  let fixture: ComponentFixture<SolarResultsComponent>;

  const mockResult: SolarCalculationResult = {
    totalDailyKwh: 25.5,
    hourlyGeneration: [
      { hour: '00:00', kwh: 0, irradiance: 0 },
      { hour: '06:00', kwh: 0.5, irradiance: 50 },
      { hour: '09:00', kwh: 2.5, irradiance: 350 },
      { hour: '12:00', kwh: 4.5, irradiance: 850 },
      { hour: '15:00', kwh: 3.2, irradiance: 550 },
      { hour: '18:00', kwh: 0.8, irradiance: 100 },
      { hour: '21:00', kwh: 0, irradiance: 0 },
    ],
    peakHours: ['10:00', '11:00', '12:00', '13:00', '14:00'],
    cloudImpact: 15
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SolarResultsComponent, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(SolarResultsComponent);
    component = fixture.componentInstance;
    component.result = mockResult;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display total daily generation', () => {
    expect(component.result.totalDailyKwh).toBe(25.5);
    const compiled = fixture.nativeElement;
    const totalElement = compiled.querySelector('.generation-value .value');
    expect(totalElement?.textContent).toContain('25.5');
  });

  it('should display cloud impact when present', () => {
    const compiled = fixture.nativeElement;
    const cloudElement = compiled.querySelector('.cloud-impact');
    expect(cloudElement).toBeTruthy();
    expect(cloudElement?.textContent).toContain('15%');
  });

  it('should display peak hours', () => {
    expect(component.result.peakHours.length).toBe(5);
    const compiled = fixture.nativeElement;
    const chips = compiled.querySelectorAll('mat-chip');
    expect(chips.length).toBe(5);
  });

  it('should calculate max generation correctly', () => {
    const max = component.getMaxGeneration();
    expect(max).toBe('4.50');
  });

  it('should calculate productive hours correctly', () => {
    const hours = component.getProductiveHours();
    expect(hours).toBe(5); // Hours with kwh > 0
  });

  it('should calculate average generation correctly', () => {
    const avg = component.getAverageGeneration();
    const expectedAvg = (0.5 + 2.5 + 4.5 + 3.2 + 0.8) / 5;
    expect(parseFloat(avg)).toBeCloseTo(expectedAvg, 2);
  });

  it('should create canvas element for chart', () => {
    const compiled = fixture.nativeElement;
    const canvas = compiled.querySelector('canvas');
    expect(canvas).toBeTruthy();
  });

  it('should draw chart after view init', () => {
    const drawChartSpy = jest.spyOn<any, any>(component, 'drawChart');
    component.ngAfterViewInit();
    expect(drawChartSpy).toHaveBeenCalled();
  });

  it('should redraw chart when result changes', () => {
    const drawChartSpy = jest.spyOn<any, any>(component, 'drawChart');
    
    const newResult: SolarCalculationResult = {
      ...mockResult,
      totalDailyKwh: 30.0
    };
    
    component.ngOnChanges({
      result: {
        currentValue: newResult,
        previousValue: mockResult,
        firstChange: false,
        isFirstChange: () => false
      }
    });
    
    expect(drawChartSpy).toHaveBeenCalled();
  });

  it('should not draw chart on first change', () => {
    const drawChartSpy = jest.spyOn<any, any>(component, 'drawChart');
    
    component.ngOnChanges({
      result: {
        currentValue: mockResult,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true
      }
    });
    
    expect(drawChartSpy).not.toHaveBeenCalled();
  });

  it('should display statistics correctly', () => {
    const compiled = fixture.nativeElement;
    const statItems = compiled.querySelectorAll('.stat-item');
    expect(statItems.length).toBe(3);
    
    // Check that statistics are displayed
    const statValues = compiled.querySelectorAll('.stat-value');
    expect(statValues.length).toBe(3);
    expect(statValues[0].textContent).toContain('4.50'); // Max generation
    expect(statValues[1].textContent).toContain('5'); // Productive hours
  });

  it('should handle zero generation gracefully', () => {
    component.result = {
      totalDailyKwh: 0,
      hourlyGeneration: Array(24).fill(null).map((_, i) => ({
        hour: `${i.toString().padStart(2, '0')}:00`,
        kwh: 0,
        irradiance: 0
      })),
      peakHours: [],
      cloudImpact: 100
    };
    fixture.detectChanges();

    expect(component.getMaxGeneration()).toBe('0.00');
    expect(component.getProductiveHours()).toBe(0);
    expect(component.getAverageGeneration()).toBe('0');
  });

  it('should display no cloud impact when zero', () => {
    component.result = {
      ...mockResult,
      cloudImpact: 0
    };
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement;
    const cloudElement = compiled.querySelector('.cloud-impact');
    expect(cloudElement).toBeFalsy();
  });
});