import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, catchError, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  ActivityRecommendation, 
  ActivitySettings 
} from '../../../../../shared/models/activity.model';

@Injectable({
  providedIn: 'root'
})
export class ActivityService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/activities`;
  
  private recommendationsCache = new Map<string, {
    data: ActivityRecommendation[];
    timestamp: number;
  }>();
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  getRecommendations(
    latitude: number,
    longitude: number,
    units: 'imperial' | 'metric' = 'imperial',
    settings?: ActivitySettings
  ): Observable<ActivityRecommendation[]> {
    const cacheKey = `${latitude}-${longitude}-${units}-${JSON.stringify(settings || {})}`;
    const cached = this.recommendationsCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return of(cached.data);
    }

    let params = new HttpParams()
      .set('lat', latitude.toString())
      .set('lon', longitude.toString())
      .set('units', units);

    if (settings) {
      params = params.set('settings', JSON.stringify(settings));
    }

    return this.http.get<ActivityRecommendation[]>(this.apiUrl, { params }).pipe(
      map(recommendations => {
        this.recommendationsCache.set(cacheKey, {
          data: recommendations,
          timestamp: Date.now()
        });
        return recommendations;
      }),
      catchError(error => {
        console.error('Error fetching activity recommendations:', error);
        return of([]);
      })
    );
  }

  clearCache(): void {
    this.recommendationsCache.clear();
  }
}