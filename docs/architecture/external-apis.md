# External APIs

## OpenWeatherMap API

- **Purpose:** Primary source for all weather data including current conditions, forecasts, and weather map tiles
- **Documentation:** https://openweathermap.org/api
- **Base URL(s):** https://api.openweathermap.org/data/3.0
- **Authentication:** API Key in query parameter (`appid={API_KEY}`)
- **Rate Limits:** Free tier: 60 calls/minute, 1,000 calls/day

**Key Endpoints Used:**
- `GET /onecall?lat={lat}&lon={lon}&exclude={part}` - Current weather and 7-day forecast in one call
- `GET /weather?lat={lat}&lon={lon}` - Current weather only (lighter response)
- `Tile Layer /{layer}/{z}/{x}/{y}.png` - Weather map tiles for temperature, precipitation, clouds

**Integration Notes:** Use One Call API 3.0 for efficiency. Implement aggressive caching (10 minutes minimum). Map tiles can be cached longer (30+ minutes).

## Google Maps JavaScript API

- **Purpose:** Interactive map interface for weather visualization and location selection
- **Documentation:** https://developers.google.com/maps/documentation/javascript
- **Base URL(s):** https://maps.googleapis.com/maps/api/js
- **Authentication:** API Key in script URL + referrer restrictions
- **Rate Limits:** $200/month free credit (28,000 map loads)

**Key Endpoints Used:**
- `Script Load /js?key={API_KEY}&libraries=places` - Load Maps JavaScript library
- `Geocoding API /geocode/json` - Convert coordinates to addresses (through NestJS proxy)
- `Places Autocomplete` - Location search suggestions (client-side library)

**Integration Notes:** Configure API key to allow http://localhost:* for development. Use lazy loading to only initialize map when needed.

## National Weather Service API

- **Purpose:** Official US government severe weather alerts and warnings
- **Documentation:** https://www.weather.gov/documentation/services-web-api
- **Base URL(s):** https://api.weather.gov
- **Authentication:** None required (public API)
- **Rate Limits:** No official limits, but respectful use expected

**Key Endpoints Used:**
- `GET /alerts/active?point={lat},{lon}` - Active alerts for specific coordinates
- `GET /points/{lat},{lon}` - Get forecast office and grid coordinates

**Integration Notes:** No authentication needed, completely free. Cache alerts for 5 minutes during active weather. Always attribute as "Source: National Weather Service" for liability protection.
