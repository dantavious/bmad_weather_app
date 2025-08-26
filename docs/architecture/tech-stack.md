# Tech Stack

This is the DEFINITIVE technology selection for the entire project. All development must use these exact versions.

## Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
|----------|------------|---------|---------|-----------|
| Frontend Language | TypeScript | 5.6+ | Type-safe development | Shared types with backend, excellent IDE support |
| Frontend Framework | Angular | 20.0 | SPA framework | Latest stable, signal support, enhanced PWA capabilities |
| UI Component Library | Angular Material | 20.0 | Material Design 3 components | Native Angular integration, MD3 theming, accessibility |
| State Management | RxJS + Signals | 7.8+ / Native | Reactive state management | RxJS for streams, Signals for simpler state |
| Backend Language | TypeScript | 5.6+ | Type-safe backend | Code sharing with frontend, consistent tooling |
| Backend Framework | NestJS | 11.0+ | Node.js framework | Latest decorators, improved performance, Angular-like architecture |
| API Style | REST | OpenAPI 3.1 | HTTP API | Simple, well-understood, easy to cache |
| Database | PostgreSQL | 17 | Future user accounts (Phase 2) | Latest stable, improved performance |
| Cache | In-Memory/Redis | N/A / 7.4 | API response caching | Memory for local, Redis for future production |
| File Storage | Local FS | N/A | Cache persistence | Simple file system for local MVP |
| Authentication | JWT | RFC 7519 | Future auth (Phase 2) | Stateless, works with PWA |
| Frontend Testing | Jest + Testing Library | 30+ / 16+ | Unit/integration tests | Latest versions, Angular 20 support |
| Backend Testing | Jest | 30+ | Unit/integration tests | NestJS 11 default, comprehensive |
| API E2E Testing | Jest + Supertest | 30+ / 7+ | API endpoint testing | Built into NestJS, no setup needed |
| Browser E2E Testing | Playwright | 1.48+ | Full user flow testing | Tests frontend + API together, superior debugging |
| Build Tool | npm workspaces | 10+ | Monorepo orchestration | Built into npm, no extra tools needed |
| Bundler | ESBuild + Vite | Via Angular CLI | Module bundling | Angular 20 uses ESBuild by default |
| IaC Tool | N/A | N/A | Local hosting for MVP | No infrastructure needed yet |
| CI/CD | GitHub Actions | N/A | Future automation | Free, integrated with repo |
| Monitoring | Console Logging | N/A | Local debugging | Built-in, sufficient for MVP |
| Logging | Pino | 9.5+ | Structured logging | Faster than Winston, better NestJS 11 support |
| CSS Framework | SCSS + Angular Material | Dart Sass 1.77+ | Styling and theming | Component styles, MD3 theming |
