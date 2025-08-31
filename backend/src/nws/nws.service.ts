import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Cron, CronExpression } from '@nestjs/schedule';

export enum AlertSeverity {
  WARNING = 'warning',
  WATCH = 'watch',
  ADVISORY = 'advisory',
}

export interface WeatherAlert {
  id: string;
  locationId: string;
  alertType: AlertSeverity;
  headline: string;
  description: string;
  startTime: Date;
  endTime: Date;
  source: string;
  isActive: boolean;
}

interface NWSAlert {
  id: string;
  properties: {
    headline: string;
    description: string;
    severity: string;
    certainty: string;
    urgency: string;
    event: string;
    effective: string;
    expires: string;
    status: string;
  };
}

@Injectable()
export class NwsService {
  private readonly logger = new Logger(NwsService.name);
  private readonly baseUrl = 'https://api.weather.gov';
  private alertCache = new Map<
    string,
    { alerts: WeatherAlert[]; timestamp: number }
  >();
  private historicalAlerts = new Map<string, WeatherAlert[]>();
  private readonly cacheTime = 5 * 60 * 1000; // 5 minutes
  private readonly historicalRetention = 24 * 60 * 60 * 1000; // 24 hours
  private locationCallbacks = new Map<
    string,
    (alerts: WeatherAlert[]) => void
  >();

  constructor(private httpService: HttpService) {}

  async fetchActiveAlerts(
    lat: number,
    lon: number,
    locationId: string,
  ): Promise<WeatherAlert[]> {
    const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    const cached = this.alertCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTime) {
      this.logger.debug(`Returning cached alerts for ${cacheKey}`);
      return cached.alerts;
    }

    try {
      const url = `${this.baseUrl}/alerts/active?point=${lat},${lon}`;
      this.logger.log(`Fetching NWS alerts for ${cacheKey}`);

      const response = await firstValueFrom(
        this.httpService.get<{ features: NWSAlert[] }>(url, {
          headers: {
            'User-Agent': 'BMad Weather App (weather.bmad.com)',
            Accept: 'application/geo+json',
          },
          timeout: 10000,
        }),
      );

      const alerts = this.parseNWSAlerts(response.data.features, locationId);

      this.alertCache.set(cacheKey, {
        alerts,
        timestamp: Date.now(),
      });

      this.storeHistoricalAlerts(locationId, alerts);

      return alerts;
    } catch (error) {
      this.logger.error(`Failed to fetch NWS alerts: ${error.message}`);
      return cached?.alerts || [];
    }
  }

  private parseNWSAlerts(
    nwsAlerts: NWSAlert[],
    locationId: string,
  ): WeatherAlert[] {
    return nwsAlerts
      .filter((alert) => alert.properties.status === 'Actual')
      .map((alert) => {
        const severity = this.mapSeverity(
          alert.properties.severity,
          alert.properties.certainty,
        );

        return {
          id: alert.id,
          locationId,
          alertType: severity,
          headline: alert.properties.headline,
          description: alert.properties.description,
          startTime: new Date(alert.properties.effective),
          endTime: new Date(alert.properties.expires),
          source: 'National Weather Service',
          isActive: new Date() < new Date(alert.properties.expires),
        };
      })
      .filter((alert) => alert.isActive);
  }

  private mapSeverity(severity: string, certainty: string): AlertSeverity {
    if (severity === 'Extreme' || severity === 'Severe') {
      return AlertSeverity.WARNING;
    }
    if (severity === 'Moderate' && certainty !== 'Unlikely') {
      return AlertSeverity.WATCH;
    }
    return AlertSeverity.ADVISORY;
  }

  private storeHistoricalAlerts(
    locationId: string,
    alerts: WeatherAlert[],
  ): void {
    const existing = this.historicalAlerts.get(locationId) || [];
    const combined = [...existing, ...alerts];

    const uniqueAlerts = Array.from(
      new Map(combined.map((a) => [a.id, a])).values(),
    );

    const recentAlerts = uniqueAlerts.filter(
      (alert) =>
        Date.now() - alert.startTime.getTime() < this.historicalRetention,
    );

    this.historicalAlerts.set(locationId, recentAlerts);
  }

  getHistoricalAlerts(locationId: string): WeatherAlert[] {
    const alerts = this.historicalAlerts.get(locationId) || [];
    return alerts.filter(
      (alert) =>
        Date.now() - alert.startTime.getTime() < this.historicalRetention,
    );
  }

  registerLocationCallback(
    locationId: string,
    callback: (alerts: WeatherAlert[]) => void,
  ): void {
    this.locationCallbacks.set(locationId, callback);
  }

  unregisterLocationCallback(locationId: string): void {
    this.locationCallbacks.delete(locationId);
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkAllLocationAlerts(): Promise<void> {
    this.logger.log('Running scheduled alert check for all locations');

    for (const [locationId, callback] of this.locationCallbacks.entries()) {
      try {
        const [lat, lon] = locationId.split(',').map(Number);
        if (!isNaN(lat) && !isNaN(lon)) {
          const alerts = await this.fetchActiveAlerts(lat, lon, locationId);
          callback(alerts);
        }
      } catch (error) {
        this.logger.error(
          `Failed to check alerts for location ${locationId}: ${error.message}`,
        );
      }
    }
  }

  clearCache(): void {
    this.alertCache.clear();
  }

  clearHistoricalAlerts(locationId?: string): void {
    if (locationId) {
      this.historicalAlerts.delete(locationId);
    } else {
      this.historicalAlerts.clear();
    }
  }
}
