# Angular 20 API Reference Documentation

## Project Angular Version
**Angular Version:** 20.2.0  
**TypeScript Version:** 5.6+  
**Angular Material:** 20.0  
**RxJS:** 7.8+

## Official Documentation Links
- **Angular 20 API Reference:** https://next.angular.dev/api
- **Angular Material 20:** https://material.angular.io/
- **Angular CLI:** https://angular.dev/tools/cli
- **Migration Guide:** https://angular.dev/update-guide

## Key Angular 20 API Patterns

### 1. Dependency Injection with inject()

**PREFERRED APPROACH - Use inject() function:**
```typescript
import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-weather',
  standalone: true,
  template: ''
})
export class WeatherComponent {
  // CORRECT: Use inject() in field initializers
  private http = inject(HttpClient);
  private weatherService = inject(WeatherService);
  
  // AVOID: Constructor injection is deprecated pattern
  // constructor(private http: HttpClient) {} // DON'T USE
}
```

**Injection Context Requirements:**
```typescript
// CORRECT: inject() in proper context
export class MyService {
  private http = inject(HttpClient); // ✅ Field initializer
  
  constructor() {
    const logger = inject(LoggerService); // ✅ Constructor
  }
}

// INCORRECT: Outside injection context
export class MyService {
  getData() {
    const http = inject(HttpClient); // ❌ ERROR: inject() must be in injection context
  }
}
```

### 2. Standalone Components (Default)

**Component Declaration:**
```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-weather-card',
  standalone: true, // REQUIRED for Angular 20
  imports: [CommonModule, MatButtonModule], // Direct imports
  template: `
    @if (weather) {
      <mat-card>{{ weather.temperature }}°F</mat-card>
    }
  `
})
export class WeatherCardComponent {}
```

**Application Bootstrap:**
```typescript
// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig);
```

### 3. Signal-Based State Management

**Creating and Using Signals:**
```typescript
import { Component, signal, computed, effect } from '@angular/core';

@Component({
  selector: 'app-weather-display',
  standalone: true,
  template: `
    <div>Temperature: {{ temperature() }}°F</div>
    <div>Feels Like: {{ feelsLike() }}°F</div>
    <button (click)="refresh()">Refresh</button>
  `
})
export class WeatherDisplayComponent {
  // Create signals
  temperature = signal(72);
  humidity = signal(65);
  
  // Computed values
  feelsLike = computed(() => {
    const temp = this.temperature();
    const hum = this.humidity();
    return Math.round(temp + (hum > 70 ? 5 : 0));
  });
  
  constructor() {
    // Side effects
    effect(() => {
      console.log('Temperature changed:', this.temperature());
    });
  }
  
  refresh() {
    this.temperature.set(75); // Set new value
    this.humidity.update(h => h + 5); // Update based on current
  }
}
```

### 4. New Control Flow Syntax

**@if, @for, @switch (Angular 20 Syntax):**
```typescript
@Component({
  selector: 'app-weather-list',
  standalone: true,
  template: `
    <!-- NEW: @if instead of *ngIf -->
    @if (loading) {
      <mat-spinner />
    } @else if (error) {
      <div class="error">{{ error }}</div>
    } @else {
      <!-- NEW: @for instead of *ngFor -->
      @for (city of cities; track city.id) {
        <weather-card [city]="city" />
      } @empty {
        <div>No cities found</div>
      }
      
      <!-- NEW: @switch instead of *ngSwitch -->
      @switch (weatherType) {
        @case ('sunny') {
          <mat-icon>wb_sunny</mat-icon>
        }
        @case ('rainy') {
          <mat-icon>umbrella</mat-icon>
        }
        @default {
          <mat-icon>cloud</mat-icon>
        }
      }
    }
  `
})
export class WeatherListComponent {}
```

### 5. Provider Configuration

**Application Configuration (app.config.ts):**
```typescript
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(withInterceptors([authInterceptor])),
    // Material Design providers automatically included with standalone components
  ]
};
```

## Deprecated APIs to Avoid

### ❌ AVOID These Patterns:

1. **NgModule-based components** - Use standalone components
```typescript
// DEPRECATED
@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule],
  bootstrap: [AppComponent]
})
export class AppModule {} // ❌ AVOID
```

2. **Constructor-based injection** - Use inject()
```typescript
// DEPRECATED
constructor(private http: HttpClient) {} // ❌ AVOID
```

3. **Old control flow directives**
```typescript
// DEPRECATED
*ngIf="condition"    // ❌ Use @if
*ngFor="let item of items"  // ❌ Use @for
*ngSwitch="value"    // ❌ Use @switch
```

4. **provideBrowserGlobalErrorListeners()** - Causes NG0203
```typescript
// DEPRECATED - Causes NG0203 error
provideBrowserGlobalErrorListeners() // ❌ REMOVE THIS
```

## Common Error Solutions

### NG0203: inject() must be called from an injection context

**Problem:** Calling inject() outside of constructor/field initializer
**Solution:**
```typescript
// WRONG
getData() {
  const http = inject(HttpClient); // NG0203 Error
}

// CORRECT
private http = inject(HttpClient);
getData() {
  return this.http.get('/api/data');
}
```

### NG0100: ExpressionChangedAfterItHasBeenCheckedError

**Problem:** Changing values after change detection
**Solution:** Use signals or setTimeout
```typescript
// Use signals for reactive updates
value = signal(0);
ngAfterViewInit() {
  this.value.set(1); // Safe with signals
}
```

### NG8001: Unknown element/component

**Problem:** Component not imported in standalone component
**Solution:**
```typescript
@Component({
  selector: 'app-example',
  standalone: true,
  imports: [WeatherCardComponent], // Add missing import
  template: '<weather-card />'
})
```

## Material Design 3 Integration

### Theme Configuration
```typescript
// styles.scss
@use '@angular/material' as mat;
@include mat.core();

$theme: mat.define-theme((
  color: (
    theme-type: light,
    primary: mat.$azure-palette,
    tertiary: mat.$blue-palette,
  ),
  typography: (
    brand-family: 'Roboto',
    plain-family: 'Roboto',
  ),
  density: (
    scale: 0
  )
));

html {
  @include mat.all-component-themes($theme);
}
```

### Component Usage
```typescript
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-weather',
  standalone: true,
  imports: [MatCardModule, MatButtonModule],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Weather</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        {{ temperature }}°F
      </mat-card-content>
      <mat-card-actions>
        <button mat-button>REFRESH</button>
      </mat-card-actions>
    </mat-card>
  `
})
```

## Testing Patterns for Angular 20

### Component Testing
```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

describe('WeatherComponent', () => {
  let component: WeatherComponent;
  let fixture: ComponentFixture<WeatherComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeatherComponent], // Import standalone component
      providers: [
        { provide: WeatherService, useValue: mockWeatherService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WeatherComponent);
    component = fixture.componentInstance;
  });

  it('should update temperature signal', () => {
    component.temperature.set(75);
    fixture.detectChanges();
    expect(component.temperature()).toBe(75);
  });
});
```

### Service Testing with inject()
```typescript
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

describe('WeatherService', () => {
  let service: WeatherService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        WeatherService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(WeatherService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });
});
```

## Best Practices Summary

1. **Always use standalone components** - Default for Angular 20
2. **Use inject() function** - Not constructor injection
3. **Adopt new control flow syntax** - @if, @for, @switch
4. **Leverage signals for state** - Better performance and DX
5. **Import what you use** - Direct imports in components
6. **Follow Material Design 3** - Use latest theming system
7. **Test with Angular Testing Library** - Better testing patterns
8. **Handle errors properly** - Use try-catch and proper error boundaries

## Additional Resources

- **Angular DevTools:** Chrome/Firefox extension for debugging
- **Angular Language Service:** VS Code extension for better IDE support
- **Angular ESLint:** Linting rules for Angular 20
- **Compodoc:** Documentation generator for Angular projects