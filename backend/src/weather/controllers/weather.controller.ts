import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { WeatherQueryDto } from '../dto/weather-query.dto';
import { OpenWeatherService } from '../services/openweather.service';
import { CacheService } from '../services/cache.service';
import { RateLimitGuard } from '../guards/rate-limit.guard';
import { Weather, DailyWeather } from '../../../../shared/models/weather.model';
import { CacheKeys } from '../../../../shared/utils/cache-keys.util';

@Controller('api/weather')
@UseGuards(RateLimitGuard)
export class WeatherController {
  constructor(
    private readonly openWeatherService: OpenWeatherService,
    private readonly cacheService: CacheService,
  ) {}

  @Post('current')
  @HttpCode(HttpStatus.OK)
  async getCurrentWeather(@Body() dto: WeatherQueryDto): Promise<Weather> {
    const units = dto.units || 'imperial';
    const cacheKey = CacheKeys.weatherCurrent(
      dto.latitude,
      dto.longitude,
      units,
    );

    const cachedWeather = await this.cacheService.get<Weather>(cacheKey);
    if (cachedWeather) {
      return cachedWeather;
    }

    const weather = await this.openWeatherService.fetchCurrentWeather(
      dto.latitude,
      dto.longitude,
      units,
    );

    await this.cacheService.set(cacheKey, weather);

    return weather;
  }

  @Post('forecast')
  @HttpCode(HttpStatus.OK)
  async getForecast(@Body() dto: WeatherQueryDto): Promise<DailyWeather[]> {
    const units = dto.units || 'imperial';
    const cacheKey = CacheKeys.weatherForecast(dto.latitude, dto.longitude);

    // Check cache first
    const cachedForecast = await this.cacheService.get<DailyWeather[]>(cacheKey);
    if (cachedForecast) {
      return cachedForecast;
    }

    // Fetch from API
    const forecast = await this.openWeatherService.fetchForecast(
      dto.latitude,
      dto.longitude,
      units,
    );

    // Cache for 1 hour (3600 seconds)
    await this.cacheService.set(cacheKey, forecast, 3600);

    return forecast;
  }
}
