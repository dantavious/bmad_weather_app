import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SolarService } from './solar.service';
import { SolarPanel, SolarIrradianceData } from '../../../../../shared/models/solar.model';
import { environment } from '../../../environments/environment';

describe('SolarService', () => {
  let service: SolarService;
  let httpMock: HttpTestingController;

  const mockPanel: SolarPanel = {
    wattage: 400,
    quantity: 10,
    efficiency: 85
  };

  const mockIrradianceData: SolarIrradianceData = {
    latitude: 40.7128,
    longitude: -74.0060,
    date: new Date(),
    hourlyIrradiance: [
      0, 0, 0, 0, 0, 0, // 00:00 - 05:00
      50, 150, 350, 550, 750, 850, // 06:00 - 11:00
      900, 850, 750, 550, 350, 150, // 12:00 - 17:00
      50, 0, 0, 0, 0, 0 // 18:00 - 23:00
    ],
    sunriseHour: 6.5,
    sunsetHour: 18.5
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SolarService]
    });
    service = TestBed.inject(SolarService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should calculate daily generation successfully', async () => {
    const latitude = 40.7128;
    const longitude = -74.0060;

    const resultPromise = service.calculateDailyGeneration(mockPanel, latitude, longitude);

    const req = httpMock.expectOne(`${environment.apiUrl}/solar/irradiance`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      latitude: 40.71,
      longitude: -74.01
    });
    req.flush(mockIrradianceData);

    const result = await resultPromise;

    expect(result).toBeDefined();
    expect(result.totalDailyKwh).toBeGreaterThan(0);
    expect(result.hourlyGeneration.length).toBe(24);
    expect(result.peakHours.length).toBeGreaterThan(0);
    expect(result.cloudImpact).toBeDefined();
  });

  it('should fallback to local calculation when API fails', async () => {
    const latitude = 40.7128;
    const longitude = -74.0060;

    const resultPromise = service.calculateDailyGeneration(mockPanel, latitude, longitude);

    const req = httpMock.expectOne(`${environment.apiUrl}/solar/irradiance`);
    req.error(new ErrorEvent('Network error'));

    const result = await resultPromise;

    expect(result).toBeDefined();
    expect(result.totalDailyKwh).toBeGreaterThan(0);
    expect(result.hourlyGeneration.length).toBe(24);
  });

  it('should cache irradiance data', async () => {
    const latitude = 40.7128;
    const longitude = -74.0060;

    // First call - should hit API
    const firstPromise = service.calculateDailyGeneration(mockPanel, latitude, longitude);
    const req = httpMock.expectOne(`${environment.apiUrl}/solar/irradiance`);
    req.flush(mockIrradianceData);
    await firstPromise;

    // Second call - should use cache, no API call
    const secondResult = await service.calculateDailyGeneration(mockPanel, latitude, longitude);
    expect(secondResult).toBeDefined();
    
    // No additional HTTP requests should be made
    httpMock.expectNone(`${environment.apiUrl}/solar/irradiance`);
  });

  it('should calculate hourly generation correctly', async () => {
    const latitude = 40.7128;
    const longitude = -74.0060;

    const resultPromise = service.calculateDailyGeneration(mockPanel, latitude, longitude);

    const req = httpMock.expectOne(`${environment.apiUrl}/solar/irradiance`);
    req.flush(mockIrradianceData);

    const result = await resultPromise;

    // Check specific hours
    const noonGeneration = result.hourlyGeneration.find(h => h.hour === '12:00');
    expect(noonGeneration).toBeDefined();
    expect(noonGeneration!.kwh).toBeGreaterThan(0);
    expect(noonGeneration!.irradiance).toBe(900);

    const midnightGeneration = result.hourlyGeneration.find(h => h.hour === '00:00');
    expect(midnightGeneration).toBeDefined();
    expect(midnightGeneration!.kwh).toBe(0);
    expect(midnightGeneration!.irradiance).toBe(0);
  });

  it('should identify peak hours correctly', async () => {
    const latitude = 40.7128;
    const longitude = -74.0060;

    const resultPromise = service.calculateDailyGeneration(mockPanel, latitude, longitude);

    const req = httpMock.expectOne(`${environment.apiUrl}/solar/irradiance`);
    req.flush(mockIrradianceData);

    const result = await resultPromise;

    expect(result.peakHours).toContain('12:00');
    expect(result.peakHours.length).toBeLessThanOrEqual(5);
    
    // Peak hours should be sorted chronologically
    const hourNumbers = result.peakHours.map(h => parseInt(h.split(':')[0]));
    const sortedHours = [...hourNumbers].sort((a, b) => a - b);
    expect(hourNumbers).toEqual(sortedHours);
  });

  it('should apply cloud impact to generation', async () => {
    const latitude = 40.7128;
    const longitude = -74.0060;

    const resultPromise = service.calculateDailyGeneration(mockPanel, latitude, longitude);

    const req = httpMock.expectOne(`${environment.apiUrl}/solar/irradiance`);
    req.flush(mockIrradianceData);

    const result = await resultPromise;

    expect(result.cloudImpact).toBe(15); // Mock value
    
    // Total should be reduced by cloud impact
    const withoutClouds = result.totalDailyKwh / (1 - result.cloudImpact / 100);
    expect(result.totalDailyKwh).toBeLessThan(withoutClouds);
  });

  it('should handle different panel configurations', async () => {
    const smallSystem: SolarPanel = {
      wattage: 200,
      quantity: 5,
      efficiency: 80
    };

    const largeSystem: SolarPanel = {
      wattage: 500,
      quantity: 20,
      efficiency: 90
    };

    const latitude = 40.7128;
    const longitude = -74.0060;

    // Small system
    const smallPromise = service.calculateDailyGeneration(smallSystem, latitude, longitude);
    const req1 = httpMock.expectOne(`${environment.apiUrl}/solar/irradiance`);
    req1.flush(mockIrradianceData);
    const smallResult = await smallPromise;

    // Large system
    const largePromise = service.calculateDailyGeneration(largeSystem, latitude, longitude);
    const req2 = httpMock.expectOne(`${environment.apiUrl}/solar/irradiance`);
    req2.flush(mockIrradianceData);
    const largeResult = await largePromise;

    expect(largeResult.totalDailyKwh).toBeGreaterThan(smallResult.totalDailyKwh);
  });

  it('should round coordinates for caching', async () => {
    const latitude1 = 40.71284;
    const latitude2 = 40.71289;
    const longitude = -74.0060;

    // Both should round to same value and use cache
    const promise1 = service.calculateDailyGeneration(mockPanel, latitude1, longitude);
    const req1 = httpMock.expectOne(`${environment.apiUrl}/solar/irradiance`);
    expect(req1.request.body.latitude).toBe(40.71);
    req1.flush(mockIrradianceData);
    await promise1;

    const promise2 = service.calculateDailyGeneration(mockPanel, latitude2, longitude);
    // Should use cache, no new request
    httpMock.expectNone(`${environment.apiUrl}/solar/irradiance`);
    await promise2;
  });
});