import { Injectable, Logger } from '@nestjs/common';
import { ActivityCalculatorService } from './activity-calculator.service';
import { OpenWeatherService } from '../../weather/services/openweather.service';
import {
  ActivityType,
  ActivityRecommendation,
  ActivitySettings,
} from '../../../../shared/models/activity.model';

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);
  private readonly recommendationCache = new Map<
    string,
    { data: ActivityRecommendation[]; timestamp: number }
  >();
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  constructor(
    private readonly calculatorService: ActivityCalculatorService,
    private readonly weatherService: OpenWeatherService,
  ) {}

  async getRecommendations(
    latitude: number,
    longitude: number,
    activitySettings?: ActivitySettings,
    units: 'imperial' | 'metric' = 'imperial',
  ): Promise<ActivityRecommendation[]> {
    const cacheKey = `${latitude}-${longitude}-${units}-${JSON.stringify(activitySettings || {})}`;
    const cached = this.recommendationCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      this.logger.debug(
        `Returning cached recommendations for location ${latitude},${longitude}`,
      );
      return cached.data;
    }

    try {
      const weatherData = await this.weatherService.fetchCurrentWeather(
        latitude,
        longitude,
        units,
      );
      const forecastData = await this.weatherService.fetchForecast(
        latitude,
        longitude,
        units,
      );

      if (!weatherData) {
        this.logger.warn(
          `No weather data available for location ${latitude},${longitude}`,
        );
        return [];
      }

      const activities =
        activitySettings?.enabledActivities || Object.values(ActivityType);
      const recommendations: ActivityRecommendation[] = [];

      for (const activity of activities) {
        const customThresholds = activitySettings?.customThresholds?.[activity];
        const recommendation = this.calculatorService.calculateActivityRating(
          activity,
          {
            temperature: weatherData.temperature,
            windSpeed: weatherData.windSpeed,
            precipitation: 0, // OpenWeather doesn't provide current precipitation in basic endpoint
            humidity: weatherData.humidity,
            hourly: forecastData?.slice(0, 8).map((f) => ({
              time: new Date(f.date).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              }),
              temperature: f.temperatureMax,
              windSpeed: f.windSpeed || weatherData.windSpeed,
              precipitation: f.precipitationProbability || 0,
              humidity: weatherData.humidity,
            })),
          },
          customThresholds,
        );
        recommendations.push(recommendation);
      }

      const sortedRecommendations = recommendations.sort(
        (a, b) => b.score - a.score,
      );

      this.recommendationCache.set(cacheKey, {
        data: sortedRecommendations,
        timestamp: Date.now(),
      });

      this.logger.debug(
        `Generated ${sortedRecommendations.length} recommendations for location ${latitude},${longitude}`,
      );
      return sortedRecommendations;
    } catch (error) {
      this.logger.error(
        `Error generating recommendations for location ${latitude},${longitude}:`,
        error,
      );
      return [];
    }
  }

  clearCache(locationId?: string): void {
    if (locationId) {
      for (const key of this.recommendationCache.keys()) {
        if (key.startsWith(locationId)) {
          this.recommendationCache.delete(key);
        }
      }
    } else {
      this.recommendationCache.clear();
    }
    this.logger.debug(`Cache cleared for ${locationId || 'all locations'}`);
  }
}
