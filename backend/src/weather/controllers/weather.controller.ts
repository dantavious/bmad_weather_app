import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { WeatherQueryDto } from '../dto/weather-query.dto';
import { OpenWeatherService } from '../services/openweather.service';
import { CacheService } from '../services/cache.service';
import { RateLimitGuard } from '../guards/rate-limit.guard';
import { Weather } from '../../../../shared/models/weather.model';
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
    const cacheKey = CacheKeys.weatherCurrent(dto.latitude, dto.longitude);
    
    const cachedWeather = await this.cacheService.get<Weather>(cacheKey);
    if (cachedWeather) {
      return cachedWeather;
    }
    
    const weather = await this.openWeatherService.fetchCurrentWeather(
      dto.latitude,
      dto.longitude,
    );
    
    await this.cacheService.set(cacheKey, weather);
    
    return weather;
  }
}