import { 
  ActivityType, 
  Rating, 
  ActivityRecommendation,
  WeatherFactors,
  ActivitySettings,
  LocationSettings
} from './activity.model';

describe('Activity Models', () => {
  describe('ActivityType Enum', () => {
    it('should have all required activity types', () => {
      expect(ActivityType.RUNNING).toBe('running');
      expect(ActivityType.CYCLING).toBe('cycling');
      expect(ActivityType.GARDENING).toBe('gardening');
      expect(ActivityType.OUTDOOR_WORK).toBe('outdoor_work');
      expect(ActivityType.STARGAZING).toBe('stargazing');
    });
  });

  describe('Rating Enum', () => {
    it('should have all rating levels', () => {
      expect(Rating.GOOD).toBe('good');
      expect(Rating.FAIR).toBe('fair');
      expect(Rating.POOR).toBe('poor');
    });
  });

  describe('ActivityRecommendation Interface', () => {
    it('should create valid recommendation object', () => {
      const recommendation: ActivityRecommendation = {
        activityType: ActivityType.RUNNING,
        rating: Rating.GOOD,
        score: 85,
        bestHours: ['06:00', '07:00', '08:00'],
        factors: {
          temperature: Rating.GOOD,
          wind: Rating.GOOD,
          precipitation: Rating.GOOD,
          humidity: Rating.FAIR,
          aqi: Rating.GOOD
        }
      };

      expect(recommendation.activityType).toBe(ActivityType.RUNNING);
      expect(recommendation.rating).toBe(Rating.GOOD);
      expect(recommendation.score).toBe(85);
      expect(recommendation.bestHours.length).toBe(3);
      expect(recommendation.factors.temperature).toBe(Rating.GOOD);
    });

    it('should allow optional AQI factor', () => {
      const factors: WeatherFactors = {
        temperature: Rating.GOOD,
        wind: Rating.FAIR,
        precipitation: Rating.GOOD,
        humidity: Rating.GOOD
      };

      expect(factors.aqi).toBeUndefined();
    });
  });

  describe('ActivitySettings Interface', () => {
    it('should create valid activity settings', () => {
      const settings: ActivitySettings = {
        enabledActivities: [ActivityType.RUNNING, ActivityType.CYCLING],
        showBestHours: true,
        showActivities: true,
        customThresholds: {
          [ActivityType.RUNNING]: {
            temperature: { min: 40, max: 75, optimal: 60 },
            wind: { max: 15 }
          }
        }
      };

      expect(settings.enabledActivities.length).toBe(2);
      expect(settings.showBestHours).toBe(true);
      expect(settings.customThresholds?.[ActivityType.RUNNING]?.temperature?.optimal).toBe(60);
    });
  });

  describe('LocationSettings Interface', () => {
    it('should create valid location settings with activity preferences', () => {
      const settings: LocationSettings = {
        alertsEnabled: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
        units: 'imperial',
        activitySettings: {
          enabledActivities: [ActivityType.RUNNING],
          showBestHours: true,
          showActivities: true
        }
      };

      expect(settings.alertsEnabled).toBe(true);
      expect(settings.units).toBe('imperial');
      expect(settings.activitySettings?.enabledActivities).toContain(ActivityType.RUNNING);
    });

    it('should allow optional activity settings', () => {
      const settings: LocationSettings = {
        alertsEnabled: false,
        units: 'metric'
      };

      expect(settings.activitySettings).toBeUndefined();
    });
  });

  describe('Model Validation', () => {
    it('should validate score range', () => {
      const isValidScore = (score: number): boolean => {
        return score >= 0 && score <= 100;
      };

      expect(isValidScore(0)).toBe(true);
      expect(isValidScore(50)).toBe(true);
      expect(isValidScore(100)).toBe(true);
      expect(isValidScore(-1)).toBe(false);
      expect(isValidScore(101)).toBe(false);
    });

    it('should validate time format for bestHours', () => {
      const isValidTimeFormat = (time: string): boolean => {
        return /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
      };

      expect(isValidTimeFormat('06:00')).toBe(true);
      expect(isValidTimeFormat('23:59')).toBe(true);
      expect(isValidTimeFormat('24:00')).toBe(false);
      expect(isValidTimeFormat('6:00')).toBe(false);
      expect(isValidTimeFormat('06:60')).toBe(false);
    });
  });
});