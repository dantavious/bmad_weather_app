import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SolarFormComponent } from './solar-form.component';
import { WeatherLocation } from '../../../../../../../shared/models/location.model';

describe('SolarFormComponent', () => {
  let component: SolarFormComponent;
  let fixture: ComponentFixture<SolarFormComponent>;

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
      name: 'Current Location',
      latitude: 34.0522,
      longitude: -118.2437,
      isPrimary: true,
      order: 1,
      createdAt: new Date(),
      settings: {
        alertsEnabled: true,
        units: 'imperial'
      }
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SolarFormComponent, ReactiveFormsModule, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(SolarFormComponent);
    component = fixture.componentInstance;
    component.savedLocations = mockLocations;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values', () => {
    expect(component.solarForm.value).toEqual({
      wattage: 400,
      quantity: 10,
      efficiency: 85,
      locationId: ''
    });
  });

  it('should validate wattage field', () => {
    const wattageControl = component.solarForm.get('wattage');
    
    wattageControl?.setValue(null);
    expect(wattageControl?.errors?.['required']).toBeTruthy();
    
    wattageControl?.setValue(30);
    expect(wattageControl?.errors?.['min']).toBeTruthy();
    
    wattageControl?.setValue(1500);
    expect(wattageControl?.errors?.['max']).toBeTruthy();
    
    wattageControl?.setValue(400);
    expect(wattageControl?.errors).toBeNull();
  });

  it('should validate quantity field', () => {
    const quantityControl = component.solarForm.get('quantity');
    
    quantityControl?.setValue(null);
    expect(quantityControl?.errors?.['required']).toBeTruthy();
    
    quantityControl?.setValue(0);
    expect(quantityControl?.errors?.['min']).toBeTruthy();
    
    quantityControl?.setValue(1001);
    expect(quantityControl?.errors?.['max']).toBeTruthy();
    
    quantityControl?.setValue(10);
    expect(quantityControl?.errors).toBeNull();
  });

  it('should validate efficiency field', () => {
    const efficiencyControl = component.solarForm.get('efficiency');
    
    efficiencyControl?.setValue(null);
    expect(efficiencyControl?.errors?.['required']).toBeTruthy();
    
    efficiencyControl?.setValue(-1);
    expect(efficiencyControl?.errors?.['min']).toBeTruthy();
    
    efficiencyControl?.setValue(101);
    expect(efficiencyControl?.errors?.['max']).toBeTruthy();
    
    efficiencyControl?.setValue(85);
    expect(efficiencyControl?.errors).toBeNull();
  });

  it('should validate location selection', () => {
    const locationControl = component.solarForm.get('locationId');
    
    expect(locationControl?.errors?.['required']).toBeTruthy();
    
    locationControl?.setValue('1');
    expect(locationControl?.errors).toBeNull();
  });

  it('should calculate system capacity correctly', () => {
    component.solarForm.patchValue({
      wattage: 500,
      quantity: 20
    });
    
    expect(component.systemCapacity()).toBe(10); // (500 * 20) / 1000 = 10 kW
  });

  it('should emit calculate event with valid form data', () => {
    jest.spyOn(component.calculate, 'emit');
    
    component.solarForm.patchValue({
      wattage: 450,
      quantity: 15,
      efficiency: 90,
      locationId: '1'
    });
    
    component.onSubmit();
    
    expect(component.calculate.emit).toHaveBeenCalledWith({
      panel: {
        wattage: 450,
        quantity: 15,
        efficiency: 90
      },
      locationId: '1'
    });
  });

  it('should not emit calculate event with invalid form', () => {
    jest.spyOn(component.calculate, 'emit');
    
    component.solarForm.patchValue({
      wattage: null,
      quantity: 10,
      efficiency: 85,
      locationId: '1'
    });
    
    component.onSubmit();
    
    expect(component.calculate.emit).not.toHaveBeenCalled();
  });

  it('should not emit calculate event when loading', () => {
    jest.spyOn(component.calculate, 'emit');
    
    component.loading = true;
    component.solarForm.patchValue({
      wattage: 400,
      quantity: 10,
      efficiency: 85,
      locationId: '1'
    });
    
    component.onSubmit();
    
    expect(component.calculate.emit).not.toHaveBeenCalled();
  });

  it('should display saved locations in dropdown', () => {
    expect(component.savedLocations).toEqual(mockLocations);
    expect(component.savedLocations.length).toBe(2);
  });

  it('should update system capacity when form values change', (done) => {
    component.solarForm.patchValue({
      wattage: 300,
      quantity: 30
    });
    
    setTimeout(() => {
      expect(component.systemCapacity()).toBe(9); // (300 * 30) / 1000 = 9 kW
      done();
    }, 100);
  });
});