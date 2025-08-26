# Development Workflow

## Local Development Setup

### Prerequisites

```bash
# Required software
node --version  # Need v20.x or higher
npm --version   # Need v10.x or higher

# Install Angular CLI globally
npm install -g @angular/cli@latest

# Install NestJS CLI globally  
npm install -g @nestjs/cli@latest
```

### Initial Setup

```bash
# Clone repository
git clone https://github.com/yourusername/datdude-weather.git
cd datdude-weather

# Install all dependencies
npm install

# Setup environment file
cp .env.example .env

# Edit .env with your API keys
# OPENWEATHER_API_KEY=your_key_here
# GOOGLE_MAPS_API_KEY=your_key_here

# Create local data directories
mkdir -p .data .cache/weather

# Verify setup
npm run dev
```

### Development Commands

```bash
# Start all services
npm run dev

# Start frontend only
npm run dev:frontend

# Start backend only
npm run dev:backend

# Run tests
npm run test

# Build for production
npm run build
```

## Environment Configuration

### Required Environment Variables

```bash
# Frontend (.env.local)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
VITE_API_URL=http://localhost:3000/api

# Backend (.env)
NODE_ENV=development
PORT=3000
OPENWEATHER_API_KEY=your_openweather_api_key
CACHE_TTL=600
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX=60

# Shared
TZ=America/Los_Angeles
LOG_LEVEL=debug
```
