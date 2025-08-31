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

### Critical Angular 20 Rules - MUST FOLLOW

#### CDK Module Import Rules (CRITICAL - Prevents NG0203 Errors)
- **NEVER import CDK modules at application level** using `importProvidersFrom`
- **DO NOT add** `PlatformModule`, `A11yModule`, `LayoutModule` to app.config.ts
- CDK services (like `BreakpointObserver`) work through dependency injection without module imports
- Material components automatically handle their CDK dependencies
- **INCORRECT (Causes NG0203):**
  ```typescript
  // app.config.ts - NEVER DO THIS
  importProvidersFrom(PlatformModule, A11yModule, LayoutModule)
  ```
- **CORRECT:**
  ```typescript
  // Just inject the service directly in components
  private breakpointObserver = inject(BreakpointObserver);
  ```

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

## Common Angular 20 Errors and Solutions

### NG0203: inject() must be called from an injection context

**Common Causes:**
1. **CDK modules imported at app level** - Most common cause!
   - Remove `importProvidersFrom(PlatformModule, A11yModule, LayoutModule)` from app.config.ts
   - CDK services work without explicit module imports in Angular 20

2. **Corrupted node_modules or cache**
   - Solution: Clean reinstall (see troubleshooting/angular-cli-cache.md)
   ```bash
   rm -rf frontend/node_modules frontend/package-lock.json
   rm -rf frontend/.angular
   npm cache clean --force
   npm install --prefix frontend
   ```

3. **inject() called outside proper context**
   - Only call inject() in constructors or field initializers
   - Never in methods or lifecycle hooks

### Service Worker Navigation Issues

**Problem:** Routes show blank pages or stale content
**Solution:** 
- Ensure navigation requests use network-first strategy
- Update cache version when modifying service worker
- Add new routes to static cache list
- Use `networkFirstForNavigation` for SPA routes

### Wildcard Routes Breaking Lazy Loading

**Problem:** NotFound component catching valid routes
**Solution:** 
- Be cautious with wildcard routes (`**`)
- Ensure they're last in route configuration
- Consider removing if causing issues with lazy loading
