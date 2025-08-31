import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SolarPanel, SolarCalculationResult, HourlyGeneration, SolarIrradianceData } from '../../../../../shared/models/solar.model';
import { environment } from '../../../environments/environment';

interface CachedSolarData {
  data: SolarIrradianceData;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class SolarService {
  private http = inject(HttpClient);
  private cache = new Map<string, CachedSolarData>();
  private readonly CACHE_TTL = 3600000; // 1 hour in milliseconds
  private readonly API_URL = `${environment.apiUrl}/solar`;

  async calculateDailyGeneration(
    panel: SolarPanel,
    latitude: number,
    longitude: number
  ): Promise<SolarCalculationResult> {
    try {
      // Get solar irradiance data (from backend or calculate)
      const irradianceData = await this.getSolarIrradiance(latitude, longitude);
      
      // Calculate hourly generation
      const hourlyGeneration = this.calculateHourlyGeneration(
        panel,
        irradianceData
      );

      // Calculate total daily generation
      const totalDailyKwh = hourlyGeneration.reduce((sum, hour) => sum + hour.kwh, 0);

      // Identify peak hours (typically 10am-2pm, but based on actual irradiance)
      const peakHours = this.identifyPeakHours(hourlyGeneration);

      // Get cloud impact from weather data (mock for now, will integrate with weather service)
      const cloudImpact = await this.getCloudImpact(latitude, longitude);

      return {
        totalDailyKwh: Math.round(totalDailyKwh * (1 - cloudImpact / 100) * 10) / 10,
        hourlyGeneration: hourlyGeneration.map(h => ({
          ...h,
          kwh: Math.round(h.kwh * (1 - cloudImpact / 100) * 100) / 100
        })),
        peakHours,
        cloudImpact
      };
    } catch (error) {
      console.error('Solar calculation error:', error);
      throw new Error('Failed to calculate solar generation');
    }
  }

  private async getSolarIrradiance(
    latitude: number,
    longitude: number
  ): Promise<SolarIrradianceData> {
    const cacheKey = this.getCacheKey(latitude, longitude);
    const cached = this.cache.get(cacheKey);

    // Check cache first
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      // Try to get from backend API
      const data = await firstValueFrom(
        this.http.post<SolarIrradianceData>(`${this.API_URL}/irradiance`, {
          latitude: Math.round(latitude * 100) / 100,
          longitude: Math.round(longitude * 100) / 100
        })
      );

      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      // Fallback to client-side calculation if backend is not available
      console.warn('Backend solar API not available, using client-side calculation');
      return this.calculateSolarIrradianceLocally(latitude, longitude);
    }
  }

  private calculateSolarIrradianceLocally(
    latitude: number,
    longitude: number
  ): SolarIrradianceData {
    const now = new Date();
    const dayOfYear = this.getDayOfYear(now);
    
    // Calculate solar declination angle
    const declination = 23.45 * Math.sin((360 * (284 + dayOfYear) / 365) * Math.PI / 180);
    
    // Calculate sunrise/sunset hours (simplified)
    const latRad = latitude * Math.PI / 180;
    const decRad = declination * Math.PI / 180;
    const sunriseAngle = Math.acos(-Math.tan(latRad) * Math.tan(decRad));
    const sunriseHour = 12 - (sunriseAngle * 180 / Math.PI) / 15;
    const sunsetHour = 12 + (sunriseAngle * 180 / Math.PI) / 15;

    // Generate hourly irradiance values
    const hourlyIrradiance: number[] = [];
    const peakIrradiance = 1000; // W/m² at solar noon on clear day
    const atmosphericTransmission = 0.75; // Clear day transmission coefficient

    for (let hour = 0; hour < 24; hour++) {
      if (hour < sunriseHour || hour > sunsetHour) {
        hourlyIrradiance.push(0);
      } else {
        // Calculate hour angle
        const hourAngle = 15 * (hour - 12);
        const hourAngleRad = hourAngle * Math.PI / 180;
        
        // Calculate solar elevation angle
        const elevation = Math.asin(
          Math.sin(decRad) * Math.sin(latRad) +
          Math.cos(decRad) * Math.cos(latRad) * Math.cos(hourAngleRad)
        );
        
        // Calculate irradiance based on elevation
        const airMass = elevation > 0 ? 1 / Math.sin(elevation) : 0;
        const irradiance = elevation > 0 
          ? peakIrradiance * Math.pow(atmosphericTransmission, airMass) * Math.sin(elevation)
          : 0;
        
        hourlyIrradiance.push(Math.round(irradiance));
      }
    }

    return {
      latitude,
      longitude,
      date: now,
      hourlyIrradiance,
      sunriseHour: Math.round(sunriseHour * 10) / 10,
      sunsetHour: Math.round(sunsetHour * 10) / 10
    };
  }

  private calculateHourlyGeneration(
    panel: SolarPanel,
    irradianceData: SolarIrradianceData
  ): HourlyGeneration[] {
    const hourlyGeneration: HourlyGeneration[] = [];
    const panelArea = 2; // Approximate m² per panel
    const systemCapacity = (panel.wattage * panel.quantity) / 1000; // kW

    for (let hour = 0; hour < 24; hour++) {
      const irradiance = irradianceData.hourlyIrradiance[hour];
      
      // Calculate generation: (Irradiance/1000) * System Capacity * Efficiency
      const generation = (irradiance / 1000) * systemCapacity * (panel.efficiency / 100);
      
      hourlyGeneration.push({
        hour: `${hour.toString().padStart(2, '0')}:00`,
        kwh: Math.round(generation * 100) / 100,
        irradiance
      });
    }

    return hourlyGeneration;
  }

  private identifyPeakHours(hourlyGeneration: HourlyGeneration[]): string[] {
    // Sort by generation amount and take top 5 hours
    const sorted = [...hourlyGeneration]
      .filter(h => h.kwh > 0)
      .sort((a, b) => b.kwh - a.kwh)
      .slice(0, 5)
      .map(h => h.hour)
      .sort(); // Sort chronologically

    return sorted;
  }

  private async getCloudImpact(latitude: number, longitude: number): Promise<number> {
    try {
      // Get current weather data for cloud cover
      const weatherResponse = await firstValueFrom(
        this.http.get<any>(`${environment.apiUrl}/weather/current`, {
          params: {
            latitude: latitude.toString(),
            longitude: longitude.toString()
          }
        })
      );
      
      // Cloud cover is typically 0-100%, convert to impact percentage
      // Higher cloud cover = higher reduction in solar generation
      const cloudCover = weatherResponse.clouds?.all || 0;
      
      // Calculate impact: 0% clouds = 0% impact, 100% clouds = ~80% impact
      // (even with full cloud cover, some diffuse radiation gets through)
      const impact = Math.min(80, cloudCover * 0.8);
      
      return Math.round(impact);
    } catch (error) {
      console.warn('Could not fetch cloud data, using default value');
      return 15; // Default 15% reduction if weather service fails
    }
  }

  private getCacheKey(latitude: number, longitude: number): string {
    const lat = Math.round(latitude * 100) / 100;
    const lon = Math.round(longitude * 100) / 100;
    const hour = new Date().toISOString().slice(0, 13);
    return `solar:${lat}:${lon}:${hour}`;
  }

  private getDayOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }
}