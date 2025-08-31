import { Injectable, Logger } from '@nestjs/common';
import { SolarIrradianceDto, SolarIrradianceResponseDto } from './dto/solar-calculation.dto';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class SolarService {
  private readonly logger = new Logger(SolarService.name);
  private readonly CACHE_TTL = 3600; // 1 hour in seconds

  constructor(private readonly cacheService: CacheService) {}

  async getSolarIrradiance(dto: SolarIrradianceDto): Promise<SolarIrradianceResponseDto> {
    const { latitude, longitude } = dto;
    
    // Round coordinates for consistent caching
    const lat = Math.round(latitude * 100) / 100;
    const lon = Math.round(longitude * 100) / 100;
    
    // Check cache first
    const cacheKey = this.getCacheKey(lat, lon);
    const cached = await this.cacheService.get<SolarIrradianceResponseDto>(cacheKey);
    
    if (cached) {
      this.logger.debug(`Solar irradiance cache hit for ${lat}, ${lon}`);
      return cached;
    }

    // Calculate solar irradiance
    const irradianceData = this.calculateSolarIrradiance(lat, lon);
    
    // Cache the result
    await this.cacheService.set(cacheKey, irradianceData, this.CACHE_TTL);
    this.logger.debug(`Solar irradiance calculated and cached for ${lat}, ${lon}`);
    
    return irradianceData;
  }

  private calculateSolarIrradiance(latitude: number, longitude: number): SolarIrradianceResponseDto {
    const now = new Date();
    const dayOfYear = this.getDayOfYear(now);
    
    // Calculate solar declination angle
    const declination = 23.45 * Math.sin((360 * (284 + dayOfYear) / 365) * Math.PI / 180);
    
    // Calculate sunrise/sunset hours
    const latRad = latitude * Math.PI / 180;
    const decRad = declination * Math.PI / 180;
    
    let sunriseHour = 6; // Default for equator
    let sunsetHour = 18;
    
    // Check for polar day/night conditions
    const cosHourAngle = -Math.tan(latRad) * Math.tan(decRad);
    
    if (cosHourAngle < -1) {
      // Polar day
      sunriseHour = 0;
      sunsetHour = 24;
    } else if (cosHourAngle > 1) {
      // Polar night
      sunriseHour = 12;
      sunsetHour = 12;
    } else {
      const sunriseAngle = Math.acos(cosHourAngle);
      sunriseHour = 12 - (sunriseAngle * 180 / Math.PI) / 15;
      sunsetHour = 12 + (sunriseAngle * 180 / Math.PI) / 15;
    }

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
        const sinElevation = 
          Math.sin(decRad) * Math.sin(latRad) +
          Math.cos(decRad) * Math.cos(latRad) * Math.cos(hourAngleRad);
        
        const elevation = Math.asin(Math.max(-1, Math.min(1, sinElevation)));
        
        // Calculate irradiance based on elevation
        if (elevation > 0) {
          const airMass = 1 / Math.sin(elevation);
          const irradiance = peakIrradiance * Math.pow(atmosphericTransmission, airMass) * Math.sin(elevation);
          hourlyIrradiance.push(Math.round(Math.max(0, irradiance)));
        } else {
          hourlyIrradiance.push(0);
        }
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

  private getCacheKey(latitude: number, longitude: number): string {
    const hour = new Date().toISOString().slice(0, 13);
    return `solar:irradiance:${latitude}:${longitude}:${hour}`;
  }

  private getDayOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  }
}