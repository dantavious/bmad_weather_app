import { Module } from '@nestjs/common';
import { GeocodeController } from './controllers/geocode.controller';
import { GeocodeService } from './services/geocode.service';
import { SearchModule } from '../search/search.module';
import { WeatherModule } from '../weather/weather.module';

@Module({
  imports: [SearchModule, WeatherModule],
  controllers: [GeocodeController],
  providers: [GeocodeService],
  exports: [GeocodeService],
})
export class GeocodeModule {}
