export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  openweather: {
    apiKey: process.env.OPENWEATHER_API_KEY,
  },
  cache: {
    ttlSeconds: parseInt(process.env.CACHE_TTL_SECONDS || '600', 10),
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '60', 10),
  },
});