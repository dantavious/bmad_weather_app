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

## Angular 20 Specific Patterns

### Dependency Injection
- **MANDATORY:** Use `inject()` function over constructor injection
- Place inject() calls in field initializers or constructors only
- Never call inject() in methods or lifecycle hooks

### Component Architecture
- **Standalone Components:** Default approach for all new components
- Import dependencies directly in component imports array
- No NgModule declarations needed

### State Management
- **Signals:** Primary reactive primitive for simple state
- Use `signal()`, `computed()`, and `effect()` from @angular/core
- RxJS for complex async operations and streams
- Never mutate signal values directly, use `.set()` or `.update()`

### Control Flow Syntax
- **@if** instead of *ngIf
- **@for** instead of *ngFor (always include track expression)
- **@switch** instead of *ngSwitch
- **@defer** for lazy loading components

### Material Design 3 Integration
- Import Material modules individually in standalone components
- Follow MD3 theming patterns with define-theme()
- Use Material components for all UI elements
- Maintain consistent elevation and spacing

### Example Patterns

```typescript
// CORRECT: Modern Angular 20 Component
@Component({
  selector: 'app-weather',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    @if (weather()) {
      <mat-card>
        <mat-card-content>
          {{ weather().temperature }}°F
        </mat-card-content>
      </mat-card>
    }
  `
})
export class WeatherComponent {
  private weatherService = inject(WeatherService);
  weather = signal<Weather | null>(null);
  
  constructor() {
    effect(() => {
      console.log('Weather updated:', this.weather());
    });
  }
}

// INCORRECT: Legacy patterns to avoid
// - Constructor injection
// - NgModule declarations  
// - *ngIf, *ngFor directives
// - Direct state mutation
```

## Naming Conventions

| Element | Frontend | Backend | Example |
|---------|----------|---------|---------|
| Components | PascalCase | - | `WeatherCard.tsx` |
| Services | PascalCase | PascalCase | `WeatherService.ts` |
| Methods | camelCase | camelCase | `getCurrentWeather()` |
| API Routes | - | kebab-case | `/api/weather-alerts` |
| Files | kebab-case | kebab-case | `weather-card.component.ts` |
