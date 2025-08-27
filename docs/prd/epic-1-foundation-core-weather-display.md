# Epic 1: Foundation & Core Weather Display

**Goal:** Establish the technical foundation and deliver a working weather application that displays current conditions and forecasts for multiple locations. This epic creates the base infrastructure while delivering immediate value through basic weather functionality.

## Story 1.1: Project Setup and Infrastructure

As a developer,  
I want a properly configured monorepo with Angular and NestJS,  
so that I can efficiently develop and deploy both frontend and backend.

**Acceptance Criteria:**
1. Nx workspace initialized with Angular 19 and NestJS applications
2. TypeScript path mappings configured for shared interfaces
3. ESLint and Prettier configured with consistent rules
4. Jest testing framework configured for both applications
5. Git repository initialized with proper .gitignore
6. GitHub repository created with branch protection rules
7. Basic README with setup instructions
8. Development servers run successfully for both apps

## Story 1.2: NestJS Weather Service Foundation

As a developer,  
I want a NestJS backend that fetches and caches weather data,  
so that the frontend can securely access weather information without exposing API keys.

**Acceptance Criteria:**
1. NestJS application serves on localhost:3000 with health check endpoint
2. OpenWeatherMap API integration with secure key storage in environment variables
3. Weather controller with endpoint to fetch current weather by coordinates
4. Cache manager configured to store API responses for 10 minutes
5. Rate limiting middleware restricts to 60 requests per minute per IP
6. Error handling returns appropriate HTTP status codes
7. Logging service captures all API requests and errors
8. Unit tests achieve 80% coverage for weather service

## Story 1.3: Angular Application Shell with Material Design 3

As a user,  
I want to see a professional-looking application shell,  
so that I can navigate and understand the application structure.

**Acceptance Criteria:**
1. Angular application with Material Design 3 theme configured
2. Responsive layout with Material 3 navigation components
3. Dark mode enabled by default with theme toggle in header
4. Loading states using Material progress indicators
5. Error boundary with user-friendly error messages
6. Home route displays placeholder content
7. Material 3 typography and color system applied
8. Application passes Lighthouse PWA basic audit

## Story 1.4: Location Dashboard with Current Weather

As a user,  
I want to see current weather for my saved locations,  
so that I can quickly check conditions without navigation.

**Acceptance Criteria:**
1. Dashboard displays up to 5 location cards in responsive grid
2. Each card shows location name, current temperature, and conditions
3. Weather icons represent current conditions using Material Symbols
4. Cards use Material 3 elevated surface with proper shadows
5. Loading skeleton shows while fetching data
6. Error state displays if weather fetch fails
7. RxJS observables manage state updates
8. Temperature displays in user's preferred units (F/C)

## Story 1.5: Search and Add Location

As a user,  
I want to search for and add new locations,  
so that I can monitor weather in places I care about.

**Acceptance Criteria:**
1. Material 3 search bar with text input in header
2. Autocomplete suggests cities as user types (minimum 3 characters)
3. Search supports city name, ZIP code, and coordinates
4. Voice input button activates Web Speech API (where supported)
5. Visual feedback shows recording state during voice input
6. Selected location adds to dashboard if under 5 location limit
7. Error message displays if location limit reached
8. Added locations persist in IndexedDB

## Story 1.6: Seven-Day Forecast Display

As a user,  
I want to see extended forecasts for my locations,  
so that I can plan activities for the week ahead.

**Acceptance Criteria:**
1. Card flip animation reveals 7-day forecast on back
2. Each day shows high/low temperature and condition icon
3. Precipitation percentage displayed when > 0%
4. Smooth 3D flip animation at 60fps
5. Flip state persists during session
6. Forecast data fetched from NestJS endpoint
7. Cache prevents redundant API calls
8. Mobile swipe gesture triggers flip
