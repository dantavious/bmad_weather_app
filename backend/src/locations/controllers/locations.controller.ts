import {
  Controller,
  Get,
  Param,
  Post,
  Put,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { LocationService } from '../services/location.service';
import { WeatherLocation } from '@shared/models/location.model';

@Controller('api/locations')
export class LocationsController {
  constructor(private readonly locationService: LocationService) {}

  @Get()
  findAll(): Observable<WeatherLocation[]> {
    return this.locationService.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string): Observable<WeatherLocation | undefined> {
    return this.locationService.findById(id);
  }

  @Get('coordinates/:lat/:lon')
  findByCoordinates(
    @Param('lat') lat: string,
    @Param('lon') lon: string,
  ): Observable<WeatherLocation | undefined> {
    return this.locationService.findByCoordinates(
      parseFloat(lat),
      parseFloat(lon),
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body()
    locationData: {
      name: string;
      latitude: number;
      longitude: number;
      country?: string;
      state?: string;
    },
  ): Observable<WeatherLocation> {
    return this.locationService.create(locationData);
  }

  @Delete(':id')
  delete(@Param('id') id: string): Observable<boolean> {
    return this.locationService.delete(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updates: Partial<WeatherLocation>,
  ): Observable<WeatherLocation | undefined> {
    return this.locationService.update(id, updates);
  }
}
