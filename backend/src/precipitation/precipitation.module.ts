import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { PrecipitationMonitorService } from './precipitation-monitor.service';
import { PrecipitationController } from './precipitation.controller';
import { WeatherModule } from '../weather/weather.module';

@Module({
  imports: [HttpModule, ConfigModule, WeatherModule],
  controllers: [PrecipitationController],
  providers: [PrecipitationMonitorService],
  exports: [PrecipitationMonitorService],
})
export class PrecipitationModule {}