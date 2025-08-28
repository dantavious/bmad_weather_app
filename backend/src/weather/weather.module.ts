import { Module } from '@nestjs/common';
import { WeatherController } from './controllers/weather.controller';
import { OpenWeatherService } from './services/openweather.service';
import { CacheService } from './services/cache.service';
import { RateLimitGuard } from './guards/rate-limit.guard';

@Module({
  controllers: [WeatherController],
  providers: [OpenWeatherService, CacheService, RateLimitGuard],
  exports: [OpenWeatherService, CacheService],
})
export class WeatherModule {}
