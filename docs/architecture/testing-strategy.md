# Testing Strategy

## Testing Pyramid

```text
        E2E Tests (10%)
        /              \
    Integration Tests (30%)
    /                      \
Frontend Unit (30%)  Backend Unit (30%)
```

## Test Examples

### Frontend Component Test

```typescript
describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [{ provide: WeatherService, useValue: spy }]
    });
    
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('should display weather cards for all locations', () => {
    component.locations = signal([
      { id: '1', name: 'Seattle', latitude: 47.6, longitude: -122.3 }
    ]);
    
    fixture.detectChanges();
    
    const cards = fixture.nativeElement.querySelectorAll('.weather-card');
    expect(cards.length).toBe(1);
  });
});
```

### Backend API Test

```typescript
describe('WeatherController', () => {
  let controller: WeatherController;
  let service: WeatherService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WeatherController],
      providers: [WeatherService]
    }).compile();

    controller = module.get<WeatherController>(WeatherController);
    service = module.get<WeatherService>(WeatherService);
  });

  it('should return weather data for coordinates', async () => {
    const mockWeather = { temperature: 72, conditions: 'Clear' };
    jest.spyOn(service, 'fetchCurrentWeather').mockResolvedValue(mockWeather);

    const result = await controller.getCurrentWeather({
      latitude: 47.6,
      longitude: -122.3
    });

    expect(result).toEqual(mockWeather);
  });
});
```

### E2E Test

```typescript
test.describe('Weather Flow', () => {
  test('should search and add a location', async ({ page }) => {
    await page.goto('http://localhost:4200');
    
    await page.fill('[data-testid="location-search"]', 'Seattle');
    await page.click('[data-testid="search-button"]');
    
    await page.click('text=Seattle, WA');
    
    await expect(page.locator('[data-testid="location-card"]')).toContainText('Seattle');
    await expect(page.locator('[data-testid="temperature"]')).toBeVisible();
  });
});
```
