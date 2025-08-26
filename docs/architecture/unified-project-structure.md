# Unified Project Structure

```plaintext
datdude-weather/
├── .github/
│   └── workflows/
│       └── ci.yaml
├── frontend/                          # Angular 20 application
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/
│   │   │   ├── features/
│   │   │   └── shared/
│   │   ├── assets/
│   │   └── main.ts
│   ├── angular.json
│   └── package.json
├── backend/                           # NestJS 11 application
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── dto/
│   │   └── main.ts
│   ├── nest-cli.json
│   └── package.json
├── shared/                            # Shared types and utilities
│   ├── models/
│   ├── constants/
│   ├── utils/
│   └── package.json
├── e2e/                               # End-to-end tests
│   ├── specs/
│   └── package.json
├── .data/                             # Local data storage (gitignored)
├── .cache/                            # API cache (gitignored)
├── scripts/
│   └── setup.js
├── docs/
│   ├── prd.md
│   └── architecture.md
├── .env.example
├── package.json                       # Root with npm workspaces
└── README.md
```

## Root package.json (npm Workspaces Configuration):

```json
{
  "name": "datdude-weather",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "frontend",
    "backend",
    "shared",
    "e2e"
  ],
  "scripts": {
    "setup": "npm install && cp .env.example .env",
    "dev": "concurrently -n \"API,WEB\" -c \"yellow,cyan\" \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:frontend": "npm --workspace=frontend run start",
    "dev:backend": "npm --workspace=backend run start:dev",
    "build": "npm run build:shared && npm run build:backend && npm run build:frontend",
    "test": "npm run test:shared && npm run test:backend && npm run test:frontend",
    "e2e": "npm --workspace=e2e run test"
  },
  "devDependencies": {
    "concurrently": "^8.2.2",
    "typescript": "^5.6.0"
  }
}
```
