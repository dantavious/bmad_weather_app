import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WeatherLegendComponent } from './weather-legend.component';
import { WeatherLayerService } from '../../../../core/services/weather-layer.service';
import { signal, importProvidersFrom } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { A11yModule } from '@angular/cdk/a11y';
import { PlatformModule } from '@angular/cdk/platform';
import { LayoutModule } from '@angular/cdk/layout';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('WeatherLegendComponent', () => {
  let component: WeatherLegendComponent;
  let fixture: ComponentFixture<WeatherLegendComponent>;
  let mockWeatherLayerService: any;

  beforeEach(async () => {
    mockWeatherLayerService = {
      activeLayer: signal(null),
      activeLayers: signal([]),
      layers: signal([])
    };

    // Set up mock data
    mockWeatherLayerService.layers.set([
      { id: 'temp_new' as any, name: 'Temperature', active: false, opacity: 0.7 },
      { id: 'precipitation_new' as any, name: 'Precipitation', active: false, opacity: 0.7 },
      { id: 'clouds_new' as any, name: 'Clouds', active: false, opacity: 0.7 }
    ]);

    await TestBed.configureTestingModule({
      imports: [WeatherLegendComponent, NoopAnimationsModule],
      providers: [
        { provide: WeatherLayerService, useValue: mockWeatherLayerService },
        importProvidersFrom(
          MatDialogModule,
          A11yModule,
          PlatformModule,
          LayoutModule
        ),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WeatherLegendComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should hide legend when no layer is active', () => {
    mockWeatherLayerService.activeLayer.set(null);
    fixture.detectChanges();
    
    expect(component.showLegend()).toBe(false);
    const legendCard = fixture.nativeElement.querySelector('.weather-legend');
    expect(legendCard).toBeFalsy();
  });

  it('should show legend when a layer is active', () => {
    mockWeatherLayerService.activeLayer.set('temp_new');
    fixture.detectChanges();
    
    expect(component.showLegend()).toBe(true);
  });

  it('should display correct legend data for temperature layer', () => {
    mockWeatherLayerService.activeLayer.set('temp_new');
    fixture.detectChanges();
    
    const legendData = component.legendData();
    expect(legendData).toBeTruthy();
    expect(legendData?.title).toBe('Temperature');
    expect(legendData?.icon).toBe('thermostat');
    expect(legendData?.scale.length).toBeGreaterThan(0);
  });

  it('should display correct legend data for precipitation layer', () => {
    mockWeatherLayerService.activeLayer.set('precipitation_new');
    fixture.detectChanges();
    
    const legendData = component.legendData();
    expect(legendData).toBeTruthy();
    expect(legendData?.title).toBe('Precipitation');
    expect(legendData?.icon).toBe('water_drop');
    expect(legendData?.scale.length).toBeGreaterThan(0);
  });

  it('should display correct legend data for clouds layer', () => {
    mockWeatherLayerService.activeLayer.set('clouds_new');
    fixture.detectChanges();
    
    const legendData = component.legendData();
    expect(legendData).toBeTruthy();
    expect(legendData?.title).toBe('Cloud Coverage');
    expect(legendData?.icon).toBe('cloud');
    expect(legendData?.scale.length).toBeGreaterThan(0);
  });

  it('should generate gradient from scale colors', () => {
    const scale = [
      { color: '#ff0000', label: 'Hot', value: '> 30°C' },
      { color: '#00ff00', label: 'Mild', value: '10-20°C' },
      { color: '#0000ff', label: 'Cold', value: '< 0°C' }
    ];
    
    const gradient = component.getGradient(scale);
    expect(gradient).toBe('linear-gradient(to right, #ff0000, #00ff00, #0000ff)');
  });

  it('should update when active layer changes', () => {
    mockWeatherLayerService.activeLayer.set(null);
    fixture.detectChanges();
    
    expect(component.showLegend()).toBe(false);
    
    // Change active layer
    mockWeatherLayerService.activeLayer.set('temp_new');
    fixture.detectChanges();
    
    expect(component.showLegend()).toBe(true);
    expect(component.legendData()?.title).toBe('Temperature');
  });

  it('should render legend elements when active', () => {
    mockWeatherLayerService.activeLayer.set('temp_new');
    fixture.detectChanges();
    
    const legendCard = fixture.nativeElement.querySelector('.weather-legend');
    expect(legendCard).toBeTruthy();
    
    const gradient = fixture.nativeElement.querySelector('.legend-gradient');
    expect(gradient).toBeTruthy();
    
    const labels = fixture.nativeElement.querySelectorAll('.legend-item');
    expect(labels.length).toBeGreaterThan(0);
  });
});
