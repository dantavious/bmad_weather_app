# Backend Architecture

## Service Architecture

### Controller/Route Organization

```text
backend/src/
├── controllers/
│   ├── weather.controller.ts
│   ├── locations.controller.ts
│   └── alerts.controller.ts
├── services/
│   ├── weather.service.ts
│   ├── cache.service.ts
│   └── openweather.service.ts
├── guards/
│   └── rate-limit.guard.ts
├── dto/
│   └── create-location.dto.ts
└── app.module.ts
```

### Controller Template

```typescript
@ApiTags('weather')
@Controller('api/weather')
@UseGuards(RateLimitGuard)
@UseInterceptors(CacheInterceptor)
export class WeatherController {
  constructor(
    private readonly weatherService: WeatherService,
    private readonly cacheService: CacheService
  ) {}

  @Post('current')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current weather for coordinates' })
  async getCurrentWeather(@Body() dto: WeatherQueryDto): Promise<WeatherData> {
    const cacheKey = CacheKeys.currentWeather(dto.latitude, dto.longitude);
    
    const cached = await this.cacheService.get<WeatherData>(cacheKey);
    if (cached) {
      return cached;
    }
    
    const weather = await this.weatherService.fetchCurrentWeather(
      dto.latitude,
      dto.longitude
    );
    
    await this.cacheService.set(cacheKey, weather, CacheKeys.TTL.CURRENT_WEATHER);
    
    return weather;
  }
}
```

## Database Architecture

### Data Access Layer

```typescript
@Injectable()
export class LocationRepository {
  private readonly dataPath = join(process.cwd(), '.data', 'locations.json');
  private locations: Map<string, WeatherLocation> = new Map();

  async onModuleInit() {
    await this.loadLocations();
  }

  private async loadLocations() {
    try {
      const data = await readFile(this.dataPath, 'utf-8');
      const locations = JSON.parse(data) as WeatherLocation[];
      locations.forEach(loc => this.locations.set(loc.id, loc));
    } catch (error) {
      this.locations = new Map();
    }
  }

  async findAll(): Promise<WeatherLocation[]> {
    return Array.from(this.locations.values())
      .sort((a, b) => a.order - b.order);
  }

  async create(location: Omit<WeatherLocation, 'id'>): Promise<WeatherLocation> {
    const id = crypto.randomUUID();
    const newLocation = { ...location, id };
    this.locations.set(id, newLocation);
    await this.persistLocations();
    return newLocation;
  }
}
```

## Authentication and Authorization

For MVP, no auth is required. Future Phase 2 JWT implementation prepared.

### Middleware/Guards

```typescript
@Injectable()
export class RateLimitGuard implements CanActivate {
  private requests = new Map<string, number[]>();
  private readonly windowMs = 60000; // 1 minute
  private readonly maxRequests = 60;

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip || request.connection.remoteAddress;
    
    const now = Date.now();
    const requestTimes = this.requests.get(ip) || [];
    
    const recentRequests = requestTimes.filter(
      time => now - time < this.windowMs
    );
    
    if (recentRequests.length >= this.maxRequests) {
      throw new HttpException(
        'Too many requests',
        HttpStatus.TOO_MANY_REQUESTS
      );
    }
    
    recentRequests.push(now);
    this.requests.set(ip, recentRequests);
    
    return true;
  }
}
```
