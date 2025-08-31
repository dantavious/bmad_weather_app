import { Injectable, Logger } from '@nestjs/common';
import {
  ActivityType,
  Rating,
  ActivityRecommendation,
  WeatherFactors,
  ActivityThresholds,
} from '../../../../shared/models/activity.model';

interface WeatherData {
  temperature: number;
  windSpeed: number;
  precipitation: number;
  humidity: number;
  aqi?: number;
  hourly?: HourlyWeatherData[];
}

interface HourlyWeatherData {
  time: string;
  temperature: number;
  windSpeed: number;
  precipitation: number;
  humidity: number;
  aqi?: number;
}

@Injectable()
export class ActivityCalculatorService {
  private readonly logger = new Logger(ActivityCalculatorService.name);

  private readonly defaultThresholds: Record<ActivityType, ActivityThresholds> =
    {
      [ActivityType.RUNNING]: {
        temperature: { min: 40, max: 75, optimal: 60 },
        wind: { max: 15 },
        precipitation: { max: 0.1 },
        humidity: { min: 30, max: 70 },
        aqi: { max: 100 },
      },
      [ActivityType.CYCLING]: {
        temperature: { min: 45, max: 85, optimal: 70 },
        wind: { max: 20 },
        precipitation: { max: 0.05 },
        humidity: { min: 20, max: 80 },
        aqi: { max: 100 },
      },
      [ActivityType.GARDENING]: {
        temperature: { min: 50, max: 85, optimal: 72 },
        wind: { max: 25 },
        precipitation: { max: 0.2 },
        humidity: { min: 40, max: 90 },
        aqi: { max: 150 },
      },
      [ActivityType.OUTDOOR_WORK]: {
        temperature: { min: 35, max: 90, optimal: 65 },
        wind: { max: 30 },
        precipitation: { max: 0.3 },
        humidity: { min: 20, max: 90 },
        aqi: { max: 150 },
      },
      [ActivityType.STARGAZING]: {
        temperature: { min: 30, max: 85, optimal: 65 },
        wind: { max: 10 },
        precipitation: { max: 0 },
        humidity: { min: 0, max: 60 },
        aqi: { max: 200 },
      },
    };

  calculateActivityRating(
    activity: ActivityType,
    weather: WeatherData,
    customThresholds?: ActivityThresholds,
  ): ActivityRecommendation {
    const thresholds = customThresholds || this.defaultThresholds[activity];
    const factors = this.evaluateWeatherFactors(activity, weather, thresholds);
    const score = this.computeOverallScore(factors);
    const rating = this.scoreToRating(score);
    const bestHours = weather.hourly
      ? this.findBestHours(activity, weather.hourly, thresholds)
      : [];

    return {
      activityType: activity,
      rating,
      score,
      bestHours,
      factors,
    };
  }

  private evaluateWeatherFactors(
    activity: ActivityType,
    weather: WeatherData,
    thresholds: ActivityThresholds,
  ): WeatherFactors {
    return {
      temperature: this.evaluateTemperature(
        weather.temperature,
        thresholds.temperature,
      ),
      wind: this.evaluateWind(weather.windSpeed, thresholds.wind),
      precipitation: this.evaluatePrecipitation(
        weather.precipitation,
        thresholds.precipitation,
      ),
      humidity: this.evaluateHumidity(weather.humidity, thresholds.humidity),
      aqi:
        weather.aqi !== undefined
          ? this.evaluateAqi(weather.aqi, thresholds.aqi)
          : undefined,
    };
  }

  private evaluateTemperature(
    temp: number,
    thresholds?: { min: number; max: number; optimal: number },
  ): Rating {
    if (!thresholds) return Rating.FAIR;

    const { min, max, optimal } = thresholds;

    if (temp < min || temp > max) {
      return Rating.POOR;
    }

    const deviation = Math.abs(temp - optimal);
    const maxDeviation = Math.max(optimal - min, max - optimal);
    const score = 1 - deviation / maxDeviation;

    if (score > 0.7) return Rating.GOOD;
    if (score > 0.3) return Rating.FAIR;
    return Rating.POOR;
  }

  private evaluateWind(
    windSpeed: number,
    thresholds?: { max: number },
  ): Rating {
    if (!thresholds) return Rating.FAIR;

    const { max } = thresholds;

    if (windSpeed > max) return Rating.POOR;
    if (windSpeed < max * 0.5) return Rating.GOOD;
    return Rating.FAIR;
  }

  private evaluatePrecipitation(
    precipitation: number,
    thresholds?: { max: number },
  ): Rating {
    if (!thresholds) return Rating.FAIR;

    const { max } = thresholds;

    if (precipitation > max) return Rating.POOR;
    if (precipitation < max * 0.3) return Rating.GOOD;
    return Rating.FAIR;
  }

  private evaluateHumidity(
    humidity: number,
    thresholds?: { min: number; max: number },
  ): Rating {
    if (!thresholds) return Rating.FAIR;

    const { min, max } = thresholds;

    if (humidity < min || humidity > max) return Rating.POOR;

    const midpoint = (min + max) / 2;
    const deviation = Math.abs(humidity - midpoint);
    const maxDeviation = (max - min) / 2;
    const score = 1 - deviation / maxDeviation;

    if (score > 0.7) return Rating.GOOD;
    if (score > 0.3) return Rating.FAIR;
    return Rating.POOR;
  }

  private evaluateAqi(aqi: number, thresholds?: { max: number }): Rating {
    if (!thresholds) return Rating.FAIR;

    const { max } = thresholds;

    if (aqi > max) return Rating.POOR;
    if (aqi <= 50) return Rating.GOOD;
    if (aqi <= max * 0.7) return Rating.FAIR;
    return Rating.POOR;
  }

  private computeOverallScore(factors: WeatherFactors): number {
    const weights = {
      temperature: 0.35,
      wind: 0.2,
      precipitation: 0.25,
      humidity: 0.15,
      aqi: 0.05,
    };

    let totalWeight = 0;
    let weightedScore = 0;

    const ratingToScore = (rating: Rating): number => {
      switch (rating) {
        case Rating.GOOD:
          return 100;
        case Rating.FAIR:
          return 50;
        case Rating.POOR:
          return 0;
      }
    };

    Object.entries(factors).forEach(([factor, rating]) => {
      if (rating !== undefined) {
        const weight = weights[factor as keyof typeof weights];
        totalWeight += weight;
        weightedScore += ratingToScore(rating) * weight;
      }
    });

    return Math.round(weightedScore / totalWeight);
  }

  private scoreToRating(score: number): Rating {
    if (score >= 70) return Rating.GOOD;
    if (score >= 40) return Rating.FAIR;
    return Rating.POOR;
  }

  private findBestHours(
    activity: ActivityType,
    hourlyData: HourlyWeatherData[],
    thresholds: ActivityThresholds,
  ): string[] {
    const hourlyRatings = hourlyData.map((hour) => ({
      time: hour.time,
      score: this.computeOverallScore(
        this.evaluateWeatherFactors(activity, hour, thresholds),
      ),
    }));

    const goodHours = hourlyRatings
      .filter((h) => h.score >= 70)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((h) => h.time);

    return goodHours;
  }
}
