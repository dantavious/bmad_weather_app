import { Test, TestingModule } from '@nestjs/testing';
import { ActivityCalculatorService } from './activity-calculator.service';
import { ActivityType, Rating } from '../../../../shared/models/activity.model';

describe('ActivityCalculatorService', () => {
  let service: ActivityCalculatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ActivityCalculatorService],
    }).compile();

    service = module.get<ActivityCalculatorService>(ActivityCalculatorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateActivityRating', () => {
    it('should calculate GOOD rating for ideal running conditions', () => {
      const weatherData = {
        temperature: 60,
        windSpeed: 5,
        precipitation: 0,
        humidity: 50,
        aqi: 30,
      };

      const result = service.calculateActivityRating(
        ActivityType.RUNNING,
        weatherData,
      );

      expect(result.activityType).toBe(ActivityType.RUNNING);
      expect(result.rating).toBe(Rating.GOOD);
      expect(result.score).toBeGreaterThanOrEqual(70);
      expect(result.factors.temperature).toBe(Rating.GOOD);
      expect(result.factors.wind).toBe(Rating.GOOD);
      expect(result.factors.precipitation).toBe(Rating.GOOD);
    });

    it('should calculate POOR rating for bad cycling conditions', () => {
      const weatherData = {
        temperature: 95,
        windSpeed: 30,
        precipitation: 0.5,
        humidity: 95,
        aqi: 150,
      };

      const result = service.calculateActivityRating(
        ActivityType.CYCLING,
        weatherData,
      );

      expect(result.rating).toBe(Rating.POOR);
      expect(result.score).toBeLessThan(40);
      expect(result.factors.temperature).toBe(Rating.POOR);
      expect(result.factors.wind).toBe(Rating.POOR);
      expect(result.factors.precipitation).toBe(Rating.POOR);
    });

    it('should calculate FAIR rating for moderate gardening conditions', () => {
      const weatherData = {
        temperature: 65,
        windSpeed: 15,
        precipitation: 0.1,
        humidity: 70,
        aqi: 75,
      };

      const result = service.calculateActivityRating(
        ActivityType.GARDENING,
        weatherData,
      );

      expect(result.rating).toBe(Rating.FAIR);
      expect(result.score).toBeGreaterThanOrEqual(40);
      expect(result.score).toBeLessThan(70);
    });

    it('should handle missing AQI data', () => {
      const weatherData = {
        temperature: 60,
        windSpeed: 5,
        precipitation: 0,
        humidity: 50,
      };

      const result = service.calculateActivityRating(
        ActivityType.RUNNING,
        weatherData,
      );

      expect(result.factors.aqi).toBeUndefined();
      expect(result.rating).toBeDefined();
      expect(result.score).toBeDefined();
    });

    it('should find best hours for stargazing', () => {
      const weatherData = {
        temperature: 65,
        windSpeed: 5,
        precipitation: 0,
        humidity: 40,
        hourly: [
          {
            time: '20:00',
            temperature: 65,
            windSpeed: 5,
            precipitation: 0,
            humidity: 40,
          },
          {
            time: '21:00',
            temperature: 62,
            windSpeed: 3,
            precipitation: 0,
            humidity: 38,
          },
          {
            time: '22:00',
            temperature: 60,
            windSpeed: 2,
            precipitation: 0,
            humidity: 35,
          },
          {
            time: '23:00',
            temperature: 58,
            windSpeed: 2,
            precipitation: 0,
            humidity: 33,
          },
          {
            time: '00:00',
            temperature: 55,
            windSpeed: 4,
            precipitation: 0,
            humidity: 40,
          },
        ],
      };

      const result = service.calculateActivityRating(
        ActivityType.STARGAZING,
        weatherData,
      );

      expect(result.bestHours).toBeDefined();
      expect(result.bestHours.length).toBeGreaterThan(0);
      expect(result.bestHours.length).toBeLessThanOrEqual(3);
    });

    it('should use custom thresholds when provided', () => {
      const weatherData = {
        temperature: 90,
        windSpeed: 5,
        precipitation: 0,
        humidity: 50,
      };

      const customThresholds = {
        temperature: { min: 80, max: 100, optimal: 90 },
        wind: { max: 10 },
        precipitation: { max: 0.1 },
        humidity: { min: 40, max: 60 },
      };

      const result = service.calculateActivityRating(
        ActivityType.RUNNING,
        weatherData,
        customThresholds,
      );

      expect(result.factors.temperature).toBe(Rating.GOOD);
      expect(result.rating).toBe(Rating.GOOD);
    });
  });

  describe('Edge cases', () => {
    it('should handle extreme cold temperatures', () => {
      const weatherData = {
        temperature: -10,
        windSpeed: 20,
        precipitation: 0,
        humidity: 80,
      };

      const result = service.calculateActivityRating(
        ActivityType.OUTDOOR_WORK,
        weatherData,
      );

      expect(result.factors.temperature).toBe(Rating.POOR);
      expect(result.rating).toBe(Rating.POOR);
    });

    it('should handle extreme heat', () => {
      const weatherData = {
        temperature: 110,
        windSpeed: 5,
        precipitation: 0,
        humidity: 20,
      };

      const result = service.calculateActivityRating(
        ActivityType.RUNNING,
        weatherData,
      );

      expect(result.factors.temperature).toBe(Rating.POOR);
      // Temperature is poor but other factors might be good, so overall rating could be fair
      expect([Rating.POOR, Rating.FAIR]).toContain(result.rating);
    });

    it('should handle heavy precipitation', () => {
      const weatherData = {
        temperature: 65,
        windSpeed: 10,
        precipitation: 2.0,
        humidity: 90,
      };

      const result = service.calculateActivityRating(
        ActivityType.CYCLING,
        weatherData,
      );

      expect(result.factors.precipitation).toBe(Rating.POOR);
    });

    it('should handle zero values', () => {
      const weatherData = {
        temperature: 0,
        windSpeed: 0,
        precipitation: 0,
        humidity: 0,
      };

      const result = service.calculateActivityRating(
        ActivityType.STARGAZING,
        weatherData,
      );

      expect(result).toBeDefined();
      expect(result.score).toBeDefined();
      expect(result.rating).toBeDefined();
    });
  });
});
