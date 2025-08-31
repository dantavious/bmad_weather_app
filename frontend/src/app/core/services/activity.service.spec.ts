import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ActivityService } from './activity.service';
import { environment } from '../../../environments/environment';
import { 
  ActivityType, 
  Rating, 
  ActivityRecommendation,
  ActivitySettings 
} from '../../../../../shared/models/activity.model';

describe('ActivityService', () => {
  let service: ActivityService;
  let httpMock: HttpTestingController;

  const mockRecommendations: ActivityRecommendation[] = [
    {
      activityType: ActivityType.RUNNING,
      rating: Rating.GOOD,
      score: 85,
      bestHours: ['06:00', '07:00'],
      factors: {
        temperature: Rating.GOOD,
        wind: Rating.GOOD,
        precipitation: Rating.GOOD,
        humidity: Rating.FAIR,
      }
    },
    {
      activityType: ActivityType.CYCLING,
      rating: Rating.FAIR,
      score: 60,
      bestHours: ['08:00'],
      factors: {
        temperature: Rating.GOOD,
        wind: Rating.FAIR,
        precipitation: Rating.GOOD,
        humidity: Rating.FAIR,
      }
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ActivityService]
    });
    service = TestBed.inject(ActivityService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    service.clearCache();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch recommendations from API', (done) => {
    const latitude = 40.7128;
    const longitude = -74.0060;

    service.getRecommendations(latitude, longitude).subscribe(recommendations => {
      expect(recommendations).toEqual(mockRecommendations);
      done();
    });

    const req = httpMock.expectOne(request => {
      return request.url === `${environment.apiUrl}/activities` &&
        request.params.get('lat') === '40.7128' &&
        request.params.get('lon') === '-74.006' &&
        request.params.get('units') === 'imperial';
    });

    expect(req.request.method).toBe('GET');
    req.flush(mockRecommendations);
  });

  it('should include activity settings in request', (done) => {
    const latitude = 40.7128;
    const longitude = -74.0060;
    const settings: ActivitySettings = {
      enabledActivities: [ActivityType.RUNNING],
      showBestHours: true,
      showActivities: true
    };

    service.getRecommendations(latitude, longitude, 'metric', settings).subscribe(recommendations => {
      expect(recommendations).toEqual(mockRecommendations);
      done();
    });

    const req = httpMock.expectOne(request => {
      return request.url === `${environment.apiUrl}/activities` &&
        request.params.get('units') === 'metric' &&
        request.params.get('settings') === JSON.stringify(settings);
    });

    req.flush(mockRecommendations);
  });

  it('should cache recommendations', (done) => {
    const latitude = 40.7128;
    const longitude = -74.0060;

    // First request
    service.getRecommendations(latitude, longitude).subscribe(() => {
      // Second request (should use cache)
      service.getRecommendations(latitude, longitude).subscribe(recommendations => {
        expect(recommendations).toEqual(mockRecommendations);
        done();
      });
    });

    // Only one HTTP request should be made
    const req = httpMock.expectOne(`${environment.apiUrl}/activities?lat=40.7128&lon=-74.006&units=imperial`);
    req.flush(mockRecommendations);
  });

  it('should handle API errors gracefully', (done) => {
    const latitude = 40.7128;
    const longitude = -74.0060;

    service.getRecommendations(latitude, longitude).subscribe(recommendations => {
      expect(recommendations).toEqual([]);
      done();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/activities?lat=40.7128&lon=-74.006&units=imperial`);
    req.error(new ErrorEvent('Network error'));
  });

  it('should clear cache', () => {
    const latitude = 40.7128;
    const longitude = -74.0060;

    // First request
    service.getRecommendations(latitude, longitude).subscribe();
    const req1 = httpMock.expectOne(`${environment.apiUrl}/api/activities?lat=40.7128&lon=-74.006&units=imperial`);
    req1.flush(mockRecommendations);

    // Clear cache
    service.clearCache();

    // Second request (should make new HTTP request)
    service.getRecommendations(latitude, longitude).subscribe();
    const req2 = httpMock.expectOne(`${environment.apiUrl}/api/activities?lat=40.7128&lon=-74.006&units=imperial`);
    req2.flush(mockRecommendations);
  });
});