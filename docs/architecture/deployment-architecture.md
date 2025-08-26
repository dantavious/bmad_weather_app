# Deployment Architecture

## Deployment Strategy

**Frontend Deployment:**
- **Platform:** Local development server
- **Build Command:** `ng build --configuration production`
- **Output Directory:** `frontend/dist/datdude-weather`
- **CDN/Edge:** N/A for local hosting

**Backend Deployment:**
- **Platform:** Local Node.js process
- **Build Command:** `nest build`
- **Deployment Method:** Node.js process manager (PM2 for local production-like environment)

## CI/CD Pipeline

```yaml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test
      
      - name: Build applications
        run: npm run build
      
      - name: Run E2E tests
        run: |
          npm run dev &
          npx wait-on http://localhost:4200
          npm run e2e
```

## Environments

| Environment | Frontend URL | Backend URL | Purpose |
|------------|--------------|-------------|---------|
| Development | http://localhost:4200 | http://localhost:3000/api | Local development with hot reload |
| Local Production | http://localhost:8080 | http://localhost:3000/api | Local production-like testing |
| Production | https://datdude.local | https://datdude.local/api | Future cloud deployment |
