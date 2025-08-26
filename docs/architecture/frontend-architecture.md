# Frontend Architecture

## Component Architecture

### Component Organization

```text
frontend/src/app/
├── core/
│   ├── services/
│   │   ├── weather.service.ts
│   │   ├── location.service.ts
│   │   └── storage.service.ts
│   └── guards/
│       └── offline.guard.ts
├── features/
│   ├── dashboard/
│   │   ├── components/
│   │   │   ├── location-card/
│   │   │   └── activity-chips/
│   │   └── dashboard.component.ts
│   ├── map/
│   │   ├── components/
│   │   │   └── weather-popup/
│   │   └── map.component.ts
│   └── search/
│       └── search.component.ts
├── shared/
│   └── components/
│       └── loading-skeleton/
└── app.component.ts
```

### Component Template

```typescript
@Component({
  selector: 'app-weather-card',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    @if (weather()) {
      <mat-card [class.flipped]="isFlipped()">
        <mat-card-content>
          {{ weather()?.temperature }}°
        </mat-card-content>
      </mat-card>
    } @else {
      <app-loading-skeleton />
    }
  `,
  styleUrl: './weather-card.component.scss'
})
export class WeatherCardComponent {
  private weatherService = inject(WeatherService);
  
  weather = signal<WeatherData | null>(null);
  isFlipped = signal(false);
  
  temperatureDisplay = computed(() => {
    const data = this.weather();
    return data ? `${Math.round(data.temperature)}°` : '--';
  });
}
```

## State Management Architecture

### State Structure

```typescript
export interface AppState {
  locations: Signal<WeatherLocation[]>;
  primaryLocation: Signal<WeatherLocation | null>;
  weatherData: Signal<Map<string, WeatherData>>;
  forecasts: Signal<Map<string, WeatherForecast[]>>;
  isOffline: Signal<boolean>;
  isLoading: Signal<boolean>;
  activeView: Signal<'dashboard' | 'map' | 'search'>;
  settings: Signal<AppSettings>;
}

@Injectable({ providedIn: 'root' })
export class StateService {
  readonly locations = signal<WeatherLocation[]>([]);
  readonly weatherData = signal<Map<string, WeatherData>>(new Map());
  
  readonly primaryLocation = computed(() => 
    this.locations().find(l => l.isPrimary)
  );
  
  readonly weatherUpdates$ = interval(60000).pipe(
    switchMap(() => this.refreshAllWeather())
  );
  
  addLocation(location: WeatherLocation) {
    this.locations.update(locs => [...locs, location]);
  }
}
```

### State Management Patterns

- Use Angular Signals for synchronous state
- Use RxJS Observables for async operations and streams
- Computed signals for derived state
- Effects for side effects and synchronization
- Service-based state management (no external library needed)
- Immutable updates using signal.update()
- Local storage sync via effects

## Routing Architecture

### Route Organization

```text
/                        # Redirects to /dashboard
/dashboard               # Main dashboard view
/map                    # Interactive map view
/search                 # Location search
/settings               # App settings
/offline                # Offline fallback page
```

### Protected Route Pattern

```typescript
export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component'),
    canActivate: [offlineGuard]
  },
  {
    path: 'map',
    loadComponent: () => import('./features/map/map.component'),
    canActivate: [offlineGuard]
  }
];
```

## Frontend Services Layer

### API Client Setup

```typescript
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:3000/api';
  
  get<T>(path: string, options = {}): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${path}`, {
      ...options
    }).pipe(
      timeout(10000),
      retry({ count: 3, delay: 1000 }),
      catchError(this.handleError)
    );
  }
}
```

### Service Example

```typescript
@Injectable({ providedIn: 'root' })
export class WeatherService {
  private api = inject(ApiService);
  private state = inject(StateService);
  
  getCurrentWeather(lat: number, lon: number): Observable<WeatherData> {
    return this.api.post<WeatherData>('/weather/current', { lat, lon }).pipe(
      shareReplay({ bufferSize: 1, refCount: true }),
      map(data => {
        this.state.weatherData.update(map => {
          map.set(`${lat}_${lon}`, data);
          return new Map(map);
        });
        return data;
      })
    );
  }
}
```
