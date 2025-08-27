# Technical Assumptions

## Repository Structure: Monorepo

The project will use an Nx workspace monorepo structure to manage both the Angular frontend and NestJS backend in a single repository. This enables code sharing through TypeScript interfaces, consistent tooling, unified CI/CD pipelines, and synchronized versioning between frontend and backend components.

## Service Architecture

**Hybrid Client-Server Architecture:** The application follows a progressive enhancement model with a lightweight NestJS backend serving as an API gateway and caching layer, while the Angular PWA handles most logic client-side. The NestJS server proxies OpenWeatherMap and NWS APIs to protect API keys, implements response caching to reduce API costs, handles push notification subscriptions, and provides rate limiting. The Angular frontend manages all UI state, implements service workers for offline functionality, and handles client-side data persistence via IndexedDB.

## Testing Requirements

**Full Testing Pyramid:** Unit tests achieving 80% coverage for business logic using Jest for both Angular and NestJS. Integration tests for all API endpoints and critical user workflows. E2E tests using Cypress for the complete user journey from search to alerts. Performance testing to validate sub-3-second load times. Accessibility testing to ensure WCAG AA compliance. Manual testing convenience methods including seed data generation and API mocking for offline development.

## Additional Technical Assumptions and Requests

- **Framework Versions:** Angular 19 (latest stable) with standalone components, NestJS 10+ with latest decorators and middleware
- **State Management:** RxJS Observables and BehaviorSubjects for all reactive state management (proven, stable, excellent TypeScript support), avoiding experimental signals
- **API Integration:** OpenWeatherMap One Call API 3.0 for weather data, Google Maps JavaScript API v3 for mapping, National Weather Service API for US alerts
- **Build Tools:** Nx for monorepo orchestration, Webpack 5 for bundling, Jest for testing
- **Deployment:** Simple Node.js deployment for both services, GitHub Actions for CI/CD, Vercel for Angular static hosting, Railway/Render for NestJS API
- **Monitoring:** NestJS built-in logging, Angular ErrorHandler for client errors, Google Analytics 4 for usage metrics
- **Security:** JWT tokens for future authentication, rate limiting per IP address, CSP headers, HTTPS-only
- **Performance:** Lazy loading for Angular routes, virtual scrolling for lists, image optimization with WebP, aggressive HTTP caching
- **Database:** PostgreSQL with TypeORM for future user accounts (Phase 2), IndexedDB for client-side storage
- **Real-time Updates:** Server-Sent Events (SSE) for weather updates if needed, Web Push API for notifications
