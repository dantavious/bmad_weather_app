import { Weather, Location, WeatherForecast } from './weather.model';

describe('Weather Models', () => {
  describe('Weather', () => {
    it('should have required properties', () => {
      const weather: Weather = {
        timestamp: new Date(),
        temperature: 25,
        feelsLike: 26,
        humidity: 60,
        pressure: 1013,
        windSpeed: 10,
        windDirection: 180,
        cloudiness: 50,
        visibility: 10000,
        description: 'Partly cloudy',
        icon: '03d',
      };

      expect(weather.temperature).toBeDefined();
      expect(weather.humidity).toBeDefined();
      expect(weather.description).toBeDefined();
    });
  });

  describe('Location', () => {
    it('should have required coordinates', () => {
      const location: Location = {
        latitude: 40.7128,
        longitude: -74.0060,
        city: 'New York',
        country: 'US',
      };

      expect(location.latitude).toBeDefined();
      expect(location.longitude).toBeDefined();
    });
  });

  describe('WeatherForecast', () => {
    it('should have location and current weather', () => {
      const forecast: WeatherForecast = {
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
        },
        current: {
          timestamp: new Date(),
          temperature: 25,
          feelsLike: 26,
          humidity: 60,
          pressure: 1013,
          windSpeed: 10,
          windDirection: 180,
          cloudiness: 50,
          visibility: 10000,
          description: 'Clear',
          icon: '01d',
        },
      };

      expect(forecast.location).toBeDefined();
      expect(forecast.current).toBeDefined();
    });
  });
});