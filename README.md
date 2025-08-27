# DatDude Weather App

A modern weather application built with Angular 20 and NestJS 11, featuring real-time weather data and forecasts.

## 🏗️ Project Structure

```
datdude-weather/
├── frontend/          # Angular 20 application
├── backend/           # NestJS 11 API server
├── shared/            # Shared TypeScript types and utilities
├── e2e/              # End-to-end Playwright tests
└── docs/             # Project documentation
```

## 📋 Prerequisites

- Node.js 20+ 
- npm 10+
- Git

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/your-username/datdude-weather.git
cd datdude-weather
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
```bash
cp .env.example .env
# Edit .env and add your OpenWeatherMap API key
```

### 4. Start development servers
```bash
npm run dev
```

This will start:
- Frontend: http://localhost:4200
- Backend API: http://localhost:3000

## 📝 Available Scripts

### Root level commands
- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build all workspaces
- `npm run test` - Run tests for all workspaces
- `npm run lint` - Lint all workspaces
- `npm run format` - Format code with Prettier
- `npm run e2e` - Run end-to-end tests

### Frontend (Angular)
```bash
npm --workspace=frontend run start    # Start dev server
npm --workspace=frontend run build    # Build for production
npm --workspace=frontend run test     # Run unit tests
npm --workspace=frontend run lint     # Lint code
```

### Backend (NestJS)
```bash
npm --workspace=backend run start:dev  # Start with hot reload
npm --workspace=backend run build      # Build for production
npm --workspace=backend run test       # Run unit tests
npm --workspace=backend run lint       # Lint code
```

## 🏛️ Architecture

### Frontend (Angular 20)
- **Framework**: Angular 20 with standalone components
- **UI Library**: Angular Material with Material Design 3
- **State Management**: RxJS + Angular Signals
- **Testing**: Jest + Testing Library

### Backend (NestJS 11)
- **Framework**: NestJS 11 with latest decorators
- **API Style**: RESTful API
- **Logging**: Pino
- **Caching**: In-memory (Redis ready for production)
- **Testing**: Jest + Supertest

### Shared
- TypeScript interfaces and models
- Utility functions
- Constants and configurations

## 🧪 Testing

### Unit Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### E2E Tests
```bash
# Run Playwright tests
npm run e2e

# Run with UI
npm --workspace=e2e run test:headed
```

## 🎨 Code Quality

### Linting
```bash
# Lint all workspaces
npm run lint

# Lint specific workspace
npm --workspace=frontend run lint
```

### Formatting
```bash
# Format all files
npm run format
```

## 🔧 Configuration

### TypeScript Path Mappings
The project uses TypeScript path mappings to share code between workspaces:
- `@shared/*` - Maps to the shared workspace

### Environment Variables
See `.env.example` for all available configuration options.

## 📦 Technology Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Frontend Framework | Angular | 20.0 |
| Backend Framework | NestJS | 11.0+ |
| Language | TypeScript | 5.6+ |
| UI Components | Angular Material | 20.0 |
| Testing | Jest | 30+ |
| E2E Testing | Playwright | 1.48+ |
| Build Tool | npm workspaces | 10+ |
| Bundler | ESBuild (via Angular CLI) | Latest |

## 🤝 Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## 📄 License

This project is private and proprietary.