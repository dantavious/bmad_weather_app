import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    api: boolean;
    cache: boolean;
    externalApis: {
      openWeatherMap: boolean;
      googleMaps: boolean;
    };
  };
  metrics?: {
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
  };
}

@Controller('health')
export class HealthController {
  private readonly startTime = Date.now();
  
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  @Get()
  async getHealth(): Promise<HealthStatus> {
    const checks = await this.performHealthChecks();
    const allHealthy = Object.values(checks).every(check => 
      typeof check === 'boolean' ? check : Object.values(check).every(v => v)
    );
    
    return {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      version: process.env.npm_package_version || '1.0.0',
      checks,
      metrics: {
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
      },
    };
  }

  @Get('liveness')
  getLiveness(): { status: string; timestamp: string } {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('readiness')
  async getReadiness(): Promise<{ ready: boolean; checks: any }> {
    const checks = await this.performHealthChecks();
    const ready = checks.api && checks.cache;
    
    return {
      ready,
      checks,
    };
  }

  private async performHealthChecks() {
    return {
      api: true, // API is responding if this endpoint works
      cache: await this.checkCache(),
      externalApis: {
        openWeatherMap: await this.checkOpenWeatherMap(),
        googleMaps: await this.checkGoogleMaps(),
      },
    };
  }

  private async checkCache(): Promise<boolean> {
    try {
      // Check if cache service is available
      // For in-memory cache, this is always true
      // For Redis, would check connection
      return true;
    } catch {
      return false;
    }
  }

  private async checkOpenWeatherMap(): Promise<boolean> {
    try {
      const apiKey = this.configService.get<string>('openweather.apiKey');
      if (!apiKey) return false;
      
      // Ping OpenWeatherMap API
      const response = await firstValueFrom(
        this.httpService.get(
          `https://api.openweathermap.org/data/2.5/weather?q=London&appid=${apiKey}`,
          { timeout: 5000 }
        )
      );
      
      return response.status === 200;
    } catch {
      return false;
    }
  }

  private async checkGoogleMaps(): Promise<boolean> {
    try {
      const apiKey = this.configService.get<string>('google.mapsApiKey');
      if (!apiKey) return false;
      
      // Ping Google Maps Geocoding API
      const response = await firstValueFrom(
        this.httpService.get(
          `https://maps.googleapis.com/maps/api/geocode/json?address=London&key=${apiKey}`,
          { timeout: 5000 }
        )
      );
      
      return response.status === 200;
    } catch {
      return false;
    }
  }
}