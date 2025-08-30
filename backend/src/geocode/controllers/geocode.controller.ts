import {
  Controller,
  Get,
  Query,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { GeocodeService } from '../services/geocode.service';
import { RateLimitGuard } from '../../weather/guards/rate-limit.guard';

@Controller('api/geocode')
export class GeocodeController {
  constructor(private readonly geocodeService: GeocodeService) {}

  @Get('reverse')
  @UseGuards(RateLimitGuard)
  async reverseGeocode(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
  ): Promise<{ locationName: string }> {
    if (!lat || !lng) {
      throw new HttpException(
        'Both lat and lng parameters are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (
      isNaN(latitude) ||
      isNaN(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      throw new HttpException(
        'Invalid coordinates provided',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.geocodeService.reverseGeocode(latitude, longitude);
  }
}
