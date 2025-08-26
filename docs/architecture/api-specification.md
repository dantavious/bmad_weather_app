# API Specification

## REST API Specification

```yaml
openapi: 3.1.0
info:
  title: DatDude Weather API
  version: 1.0.0
  description: Backend API for DatDude Weather PWA
servers:
  - url: http://localhost:3000/api
    description: Local development server

paths:
  /locations:
    get:
      summary: Get all saved locations
      tags: [Locations]
      responses:
        200:
          description: List of saved locations
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/WeatherLocation'
    
    post:
      summary: Add a new location
      tags: [Locations]
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [name, latitude, longitude]
              properties:
                name: { type: string }
                latitude: { type: number }
                longitude: { type: number }
      responses:
        201:
          description: Location created
        400:
          description: Location limit reached (max 5)

  /locations/{locationId}:
    patch:
      summary: Update location settings
      tags: [Locations]
      parameters:
        - name: locationId
          in: path
          required: true
          schema: { type: string }
      responses:
        200:
          description: Location updated
    
    delete:
      summary: Remove a location
      tags: [Locations]
      parameters:
        - name: locationId
          in: path
          required: true
          schema: { type: string }
      responses:
        204:
          description: Location deleted

  /weather/current:
    post:
      summary: Get current weather for coordinates
      tags: [Weather]
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [latitude, longitude]
              properties:
                latitude: { type: number }
                longitude: { type: number }
      responses:
        200:
          description: Current weather data

  /weather/forecast/{locationId}:
    get:
      summary: Get 7-day forecast
      tags: [Weather]
      parameters:
        - name: locationId
          in: path
          required: true
          schema: { type: string }
      responses:
        200:
          description: Weather forecast

  /weather/batch:
    post:
      summary: Get weather for multiple locations
      tags: [Weather]
      requestBody:
        content:
          application/json:
            schema:
              type: array
              items:
                type: string
      responses:
        200:
          description: Weather data for all locations

  /alerts/{locationId}:
    get:
      summary: Get weather alerts for location
      tags: [Alerts]
      parameters:
        - name: locationId
          in: path
          required: true
          schema: { type: string }
      responses:
        200:
          description: Active weather alerts

  /activities/{locationId}:
    get:
      summary: Get activity recommendations
      tags: [Activities]
      parameters:
        - name: locationId
          in: path
          required: true
          schema: { type: string }
      responses:
        200:
          description: Activity recommendations

  /search/location:
    get:
      summary: Search for location by name
      tags: [Search]
      parameters:
        - name: q
          in: query
          required: true
          schema: { type: string }
      responses:
        200:
          description: Search results
```
