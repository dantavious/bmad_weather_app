import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { LocationsModule } from './locations/locations.module';
import { WeatherModule } from './weather/weather.module';
import { SearchModule } from './search/search.module';

@Module({
  imports: [ConfigModule, WeatherModule, LocationsModule, SearchModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
