import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { LocationsModule } from './locations/locations.module';
import { WeatherModule } from './weather/weather.module';
import { SearchModule } from './search/search.module';
import { GeocodeModule } from './geocode/geocode.module';
import { PrecipitationModule } from './precipitation/precipitation.module';
import { NwsModule } from './nws/nws.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    WeatherModule,
    LocationsModule,
    SearchModule,
    GeocodeModule,
    PrecipitationModule,
    NwsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
