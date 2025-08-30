import { Controller, Get, Param, Query, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { NwsService, WeatherAlert } from './nws.service';

@Controller('api/alerts')
export class NwsController {
  private readonly logger = new Logger(NwsController.name);

  constructor(private readonly nwsService: NwsService) {}

  @Get(':locationId')
  async getActiveAlerts(
    @Param('locationId') locationId: string,
    @Query('lat') lat: string,
    @Query('lon') lon: string,
  ): Promise<WeatherAlert[]> {
    try {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lon);
      
      if (isNaN(latitude) || isNaN(longitude)) {
        throw new HttpException('Invalid coordinates', HttpStatus.BAD_REQUEST);
      }
      
      this.logger.log(`Fetching active alerts for location ${locationId} at ${latitude},${longitude}`);
      return await this.nwsService.fetchActiveAlerts(latitude, longitude, locationId);
    } catch (error) {
      this.logger.error(`Failed to get active alerts: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch weather alerts',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('historical/:locationId')
  async getHistoricalAlerts(
    @Param('locationId') locationId: string,
  ): Promise<WeatherAlert[]> {
    try {
      this.logger.log(`Fetching historical alerts for location ${locationId}`);
      return this.nwsService.getHistoricalAlerts(locationId);
    } catch (error) {
      this.logger.error(`Failed to get historical alerts: ${error.message}`);
      throw new HttpException(
        'Failed to fetch historical alerts',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}