import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WeatherPopupComponent } from './weather-popup.component';
import { importProvidersFrom } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { A11yModule } from '@angular/cdk/a11y';
import { PlatformModule } from '@angular/cdk/platform';
import { LayoutModule } from '@angular/cdk/layout';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('WeatherPopupComponent', () => {
  let component: WeatherPopupComponent;
  let fixture: ComponentFixture<WeatherPopupComponent>;

  const mockWeatherData = {
    location: 'New York, NY',
    temperature: 72,
    description: 'partly cloudy',
    humidity: 65,
    windSpeed: 12,
    icon: 'cloud_sun'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeatherPopupComponent, NoopAnimationsModule],
      providers: [
        importProvidersFrom(
          MatDialogModule,
          A11yModule,
          PlatformModule,
          LayoutModule
        ),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WeatherPopupComponent);
    component = fixture.componentInstance;
    component.data = mockWeatherData;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display location name', () => {
    const compiled = fixture.nativeElement;
    const title = compiled.querySelector('mat-card-title');
    expect(title.textContent).toContain(mockWeatherData.location);
  });

  it('should display temperature', () => {
    const compiled = fixture.nativeElement;
    const temperature = compiled.querySelector('.temp-value');
    expect(temperature.textContent).toContain(`${mockWeatherData.temperature}°`);
  });

  it('should display weather description', () => {
    const compiled = fixture.nativeElement;
    const description = compiled.querySelector('.description');
    expect(description.textContent).toContain(mockWeatherData.description);
  });

  it('should display humidity with icon', () => {
    const compiled = fixture.nativeElement;
    const details = compiled.querySelectorAll('.detail-item');
    const humidityDetail = details[0];
    
    expect(humidityDetail.querySelector('mat-icon').textContent).toContain('water_drop');
    expect(humidityDetail.querySelector('span').textContent).toContain(`${mockWeatherData.humidity}%`);
  });

  it('should display wind speed with icon', () => {
    const compiled = fixture.nativeElement;
    const details = compiled.querySelectorAll('.detail-item');
    const windDetail = details[1];
    
    expect(windDetail.querySelector('mat-icon').textContent).toContain('air');
    expect(windDetail.querySelector('span').textContent).toContain(`${mockWeatherData.windSpeed} mph`);
  });

  it('should have proper card structure', () => {
    const compiled = fixture.nativeElement;
    
    expect(compiled.querySelector('mat-card')).toBeTruthy();
    expect(compiled.querySelector('mat-card-header')).toBeTruthy();
    expect(compiled.querySelector('mat-card-content')).toBeTruthy();
    expect(compiled.querySelector('.weather-info')).toBeTruthy();
    expect(compiled.querySelector('.temperature')).toBeTruthy();
    expect(compiled.querySelector('.details')).toBeTruthy();
  });
});