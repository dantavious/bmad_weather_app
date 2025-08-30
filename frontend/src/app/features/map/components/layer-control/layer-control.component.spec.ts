import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LayerControlComponent } from './layer-control.component';
import { WeatherLayerService } from '../../../../core/services/weather-layer.service';
import { signal, importProvidersFrom } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { A11yModule } from '@angular/cdk/a11y';
import { PlatformModule } from '@angular/cdk/platform';
import { LayoutModule } from '@angular/cdk/layout';

describe('LayerControlComponent', () => {
  let component: LayerControlComponent;
  let fixture: ComponentFixture<LayerControlComponent>;
  let mockWeatherLayerService: any;

  beforeEach(async () => {
    mockWeatherLayerService = {
      toggleLayer: jest.fn(),
      updateLayerOpacity: jest.fn(),
      getLayerConfig: jest.fn(),
      saveToSession: jest.fn(),
      layers: signal([]),
      activeLayers: signal([]),
      activeLayer: signal(null)
    };
    
    // Set up mock data
    mockWeatherLayerService.layers.set([
      { id: 'temp_new' as any, name: 'Temperature', active: false, opacity: 0.7 },
      { id: 'precipitation_new' as any, name: 'Precipitation', active: false, opacity: 0.7 },
      { id: 'clouds_new' as any, name: 'Clouds', active: false, opacity: 0.7 }
    ]);

    await TestBed.configureTestingModule({
      imports: [LayerControlComponent, BrowserAnimationsModule],
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

    fixture = TestBed.createComponent(LayerControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle panel visibility', () => {
    expect(component.isExpanded()).toBe(false);
    
    component.togglePanel();
    expect(component.isExpanded()).toBe(true);
    
    component.togglePanel();
    expect(component.isExpanded()).toBe(false);
  });

  it('should toggle layer and save to session', () => {
    component.toggleLayer('temp_new' as any);
    
    expect(mockWeatherLayerService.toggleLayer).toHaveBeenCalledWith('temp_new');
    expect(mockWeatherLayerService.saveToSession).toHaveBeenCalled();
  });

  it('should update opacity and save to session', () => {
    component.updateOpacity('temp_new' as any, 50);
    
    expect(mockWeatherLayerService.updateLayerOpacity).toHaveBeenCalledWith('temp_new', 0.5);
    expect(mockWeatherLayerService.saveToSession).toHaveBeenCalled();
  });

  it('should get correct opacity percentage', () => {
    mockWeatherLayerService.getLayerConfig.mockReturnValue({
      id: 'temp_new' as any,
      name: 'Temperature',
      active: true,
      opacity: 0.8
    });
    
    const opacity = component.getOpacityPercent('temp_new' as any);
    expect(opacity).toBe(80);
  });

  it('should return default opacity when config not found', () => {
    mockWeatherLayerService.getLayerConfig.mockReturnValue(undefined);
    
    const opacity = component.getOpacityPercent('temp_new' as any);
    expect(opacity).toBe(70);
  });

  it('should get correct icon for each layer type', () => {
    expect(component.getLayerIcon('temp_new' as any)).toBe('thermostat');
    expect(component.getLayerIcon('precipitation_new' as any)).toBe('water_drop');
    expect(component.getLayerIcon('clouds_new' as any)).toBe('cloud');
  });

  it('should format opacity label correctly', () => {
    expect(component.formatOpacityLabel(50)).toBe('50%');
    expect(component.formatOpacityLabel(100)).toBe('100%');
    expect(component.formatOpacityLabel(0)).toBe('0%');
  });

  it('should detect mobile screen', () => {
    // Mock window width for mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500
    });
    (component as any).checkMobile();
    
    expect(component.isMobile()).toBe(true);
    
    // Mock desktop width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024
    });
    (component as any).checkMobile();
    
    expect(component.isMobile()).toBe(false);
  });

  it('should show FAB when panel is collapsed', () => {
    component.isExpanded.set(false);
    fixture.detectChanges();
    
    const fabButton = fixture.nativeElement.querySelector('button[mat-fab]');
    expect(fabButton).toBeTruthy();
  });

  it('should show panel when expanded', () => {
    component.isExpanded.set(true);
    fixture.detectChanges();
    
    const panel = fixture.nativeElement.querySelector('mat-card');
    expect(panel).toBeTruthy();
  });

  it('should display all layers in the panel', () => {
    component.isExpanded.set(true);
    fixture.detectChanges();
    
    const layerItems = fixture.nativeElement.querySelectorAll('mat-slide-toggle');
    expect(layerItems.length).toBe(3);
  });
});
