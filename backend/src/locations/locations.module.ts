import { Module } from '@nestjs/common';
import { LocationsController } from './controllers/locations.controller';
import { LocationService } from './services/location.service';
import { LocationRepository } from './repositories/location.repository';

@Module({
  controllers: [LocationsController],
  providers: [LocationService, LocationRepository],
})
export class LocationsModule {}
