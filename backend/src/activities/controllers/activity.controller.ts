import { Controller, Get, Query, Logger } from '@nestjs/common';
import { ActivityService } from '../services/activity.service';
import {
  ActivityRecommendation,
  ActivitySettings,
} from '../../../../shared/models/activity.model';

@Controller('api/activities')
export class ActivityController {
  private readonly logger = new Logger(ActivityController.name);

  constructor(private readonly activityService: ActivityService) {}

  @Get()
  async getActivityRecommendations(
    @Query('lat') lat: string,
    @Query('lon') lon: string,
    @Query('units') units?: 'imperial' | 'metric',
    @Query('settings') settingsJson?: string,
  ): Promise<ActivityRecommendation[]> {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      this.logger.warn(`Invalid coordinates: lat=${lat}, lon=${lon}`);
      return [];
    }

    this.logger.log(
      `Getting activity recommendations for location: ${latitude},${longitude}`,
    );

    let settings: ActivitySettings | undefined;
    if (settingsJson) {
      try {
        settings = JSON.parse(settingsJson) as ActivitySettings;
      } catch {
        this.logger.warn(`Invalid settings JSON provided: ${settingsJson}`);
      }
    }

    try {
      const recommendations = await this.activityService.getRecommendations(
        latitude,
        longitude,
        settings,
        units || 'imperial',
      );
      return recommendations;
    } catch (error) {
      this.logger.error(
        `Error getting recommendations for location ${latitude},${longitude}:`,
        error,
      );
      return [];
    }
  }
}
