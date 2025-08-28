import { TestBed, ComponentFixture } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [provideAnimationsAsync()]
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

  it('should display welcome message', () => {
    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1.textContent).toContain('Welcome to DatDude Weather');
  });

  it('should display three cards', () => {
    const cards = fixture.nativeElement.querySelectorAll('mat-card');
    expect(cards.length).toBe(3);
  });

  it('should have current location card', () => {
    const cards = fixture.nativeElement.querySelectorAll('mat-card');
    const locationCard = Array.from(cards).find((card: any) => 
      card.textContent.includes('Current Location')
    );
    expect(locationCard).toBeTruthy();
  });

  it('should have forecast card', () => {
    const cards = fixture.nativeElement.querySelectorAll('mat-card');
    const forecastCard = Array.from(cards).find((card: any) => 
      card.textContent.includes('Forecast')
    );
    expect(forecastCard).toBeTruthy();
  });

  it('should have alerts card', () => {
    const cards = fixture.nativeElement.querySelectorAll('mat-card');
    const alertsCard = Array.from(cards).find((card: any) => 
      card.textContent.includes('Alerts')
    );
    expect(alertsCard).toBeTruthy();
  });
});