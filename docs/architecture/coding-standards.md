# Coding Standards

## Critical Fullstack Rules

- **Type Sharing:** Always define types in shared/ and import from there
- **API Calls:** Never make direct HTTP calls - use the service layer
- **Environment Variables:** Access only through config objects, never process.env directly
- **Error Handling:** All API routes must use try-catch and return consistent error format
- **State Updates:** Use signals.update() or RxJS operators, never mutate directly
- **Cache Keys:** Use CacheKeys utility for consistent key generation
- **Coordinates:** Always round to 2 decimal places for caching
- **API Rate Limiting:** Check cache before making external API calls

## Naming Conventions

| Element | Frontend | Backend | Example |
|---------|----------|---------|---------|
| Components | PascalCase | - | `WeatherCard.tsx` |
| Services | PascalCase | PascalCase | `WeatherService.ts` |
| Methods | camelCase | camelCase | `getCurrentWeather()` |
| API Routes | - | kebab-case | `/api/weather-alerts` |
| Files | kebab-case | kebab-case | `weather-card.component.ts` |
