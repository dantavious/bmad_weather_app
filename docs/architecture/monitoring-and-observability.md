# Monitoring and Observability

## Monitoring Stack

- **Frontend Monitoring:** Browser console + future Google Analytics
- **Backend Monitoring:** Pino structured logging
- **Error Tracking:** Console errors for MVP, Sentry for production
- **Performance Monitoring:** Lighthouse CI in GitHub Actions

## Key Metrics

**Frontend Metrics:**
- Core Web Vitals (LCP, FID, CLS)
- JavaScript errors
- API response times
- Service Worker cache hit rate

**Backend Metrics:**
- Request rate
- Error rate (target < 0.1%)
- Response time (p95 < 500ms)
- Cache hit rate (target > 70%)
- External API calls per minute
