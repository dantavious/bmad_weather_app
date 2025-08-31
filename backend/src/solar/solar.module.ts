import { Module } from '@nestjs/common';
import { SolarController } from './solar.controller';
import { SolarService } from './solar.service';
import { CacheModule } from '../cache/cache.module';
import { WeatherModule } from '../weather/weather.module';

@Module({
  imports: [CacheModule, WeatherModule],
  controllers: [SolarController],
  providers: [SolarService],
  exports: [SolarService]
})
export class SolarModule {}