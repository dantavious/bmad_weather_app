import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { CacheService } from '../weather/services/cache.service';

interface MinutelyData {
  dt: number;
  precipitation: number;
}

export interface PrecipitationAlert {
  locationId: string;
  lat: number;
  lon: number;
  minutesToStart: number;
  precipitationType: 'rain' | 'snow' | 'sleet';
  intensity: 'light' | 'moderate' | 'heavy';
  estimatedDuration: number;
  timestamp: Date;
}

@Injectable()
export class PrecipitationMonitorService {
  private readonly logger = new Logger(PrecipitationMonitorService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.openweathermap.org/data/3.0/onecall';
  private lastAlertTime = new Map<string, Date>();
  private readonly ALERT_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes
  private readonly PRECIPITATION_THRESHOLD = 0.1; // mm

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
  ) {
    this.apiKey = this.configService.get<string>('openweather.apiKey', '');
    if (!this.apiKey) {
      throw new Error('OPENWEATHER_API_KEY is required');
    }
  }

  async checkPrecipitation(
    lat: number,
    lon: number,
    locationId: string,
  ): Promise<PrecipitationAlert | null> {
    try {
      // Round coordinates for caching
      const roundedLat = Math.round(lat * 100) / 100;
      const roundedLon = Math.round(lon * 100) / 100;
      const cacheKey = `precip:${roundedLat}:${roundedLon}`;

      // Check cache first
      const cached = await this.cacheService.get<PrecipitationAlert>(cacheKey);
      if (cached) {
        return this.processAlert(cached, locationId);
      }

      // Fetch minutely forecast
      const url = this.baseUrl;
      const params = {
        lat: roundedLat,
        lon: roundedLon,
        appid: this.apiKey,
        exclude: 'current,hourly,daily,alerts',
      };

      const response = await firstValueFrom(
        this.httpService.get(url, { params }),
      );

      const minutely: MinutelyData[] = response.data.minutely || [];

      // Analyze precipitation in next 15 minutes
      const alert = this.analyzePrecipitation(
        minutely.slice(0, 15),
        roundedLat,
        roundedLon,
        locationId,
      );

      if (alert) {
        // Cache for 5 minutes
        await this.cacheService.set(cacheKey, alert, 5 * 60);
        return this.processAlert(alert, locationId);
      }

      return null;
    } catch (error) {
      this.logger.error(
        `Failed to check precipitation for location ${locationId}`,
        error,
      );
      return null;
    }
  }

  private analyzePrecipitation(
    minutelyData: MinutelyData[],
    lat: number,
    lon: number,
    locationId: string,
  ): PrecipitationAlert | null {
    if (!minutelyData || minutelyData.length === 0) {
      return null;
    }

    // Find when precipitation starts
    let startIndex = -1;
    for (let i = 0; i < minutelyData.length; i++) {
      if (minutelyData[i].precipitation >= this.PRECIPITATION_THRESHOLD) {
        startIndex = i;
        break;
      }
    }

    if (startIndex === -1) {
      return null; // No precipitation in next 15 minutes
    }

    // Calculate intensity and duration
    let totalPrecipitation = 0;
    let endIndex = startIndex;

    for (let i = startIndex; i < minutelyData.length; i++) {
      if (minutelyData[i].precipitation >= this.PRECIPITATION_THRESHOLD) {
        totalPrecipitation += minutelyData[i].precipitation;
        endIndex = i;
      } else if (i - endIndex > 2) {
        break; // Gap of more than 2 minutes, precipitation ended
      }
    }

    const duration = endIndex - startIndex + 1;
    const avgIntensity = totalPrecipitation / duration;

    // Determine intensity level
    let intensity: 'light' | 'moderate' | 'heavy';
    if (avgIntensity < 0.5) {
      intensity = 'light';
    } else if (avgIntensity < 2.5) {
      intensity = 'moderate';
    } else {
      intensity = 'heavy';
    }

    // Determine precipitation type based on temperature (would need current temp)
    // For now, default to rain
    const precipitationType: 'rain' | 'snow' | 'sleet' = 'rain';

    return {
      locationId,
      lat,
      lon,
      minutesToStart: startIndex + 1,
      precipitationType,
      intensity,
      estimatedDuration: duration,
      timestamp: new Date(),
    };
  }

  private processAlert(
    alert: PrecipitationAlert,
    locationId: string,
  ): PrecipitationAlert | null {
    // Check cooldown
    const lastAlert = this.lastAlertTime.get(locationId);
    if (lastAlert) {
      const timeSinceLastAlert = Date.now() - lastAlert.getTime();
      if (timeSinceLastAlert < this.ALERT_COOLDOWN_MS) {
        this.logger.debug(`Alert for ${locationId} suppressed due to cooldown`);
        return null;
      }
    }

    // Update last alert time
    this.lastAlertTime.set(locationId, new Date());
    return alert;
  }

  async checkMultipleLocations(
    locations: Array<{ id: string; lat: number; lon: number }>,
  ): Promise<PrecipitationAlert[]> {
    const alerts = await Promise.all(
      locations.map((loc) => this.checkPrecipitation(loc.lat, loc.lon, loc.id)),
    );

    return alerts.filter(
      (alert): alert is PrecipitationAlert => alert !== null,
    );
  }

  clearCooldown(locationId: string): void {
    this.lastAlertTime.delete(locationId);
  }

  getCooldownStatus(locationId: string): {
    inCooldown: boolean;
    remainingMinutes?: number;
  } {
    const lastAlert = this.lastAlertTime.get(locationId);
    if (!lastAlert) {
      return { inCooldown: false };
    }

    const timeSinceLastAlert = Date.now() - lastAlert.getTime();
    if (timeSinceLastAlert >= this.ALERT_COOLDOWN_MS) {
      return { inCooldown: false };
    }

    const remainingMs = this.ALERT_COOLDOWN_MS - timeSinceLastAlert;
    const remainingMinutes = Math.ceil(remainingMs / 60000);

    return { inCooldown: true, remainingMinutes };
  }
}
