import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  PrecipitationMonitorService,
  PrecipitationAlert,
} from './precipitation-monitor.service';

interface LocationCheckDto {
  locations: Array<{
    id: string;
    lat: number;
    lon: number;
  }>;
}

@Controller('api/precipitation')
export class PrecipitationController {
  constructor(
    private readonly precipitationService: PrecipitationMonitorService,
  ) {}

  @Get('check')
  async checkLocation(
    @Query('lat') lat: string,
    @Query('lon') lon: string,
    @Query('locationId') locationId: string,
  ) {
    try {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lon);

      if (isNaN(latitude) || isNaN(longitude)) {
        throw new HttpException('Invalid coordinates', HttpStatus.BAD_REQUEST);
      }

      const alert = await this.precipitationService.checkPrecipitation(
        latitude,
        longitude,
        locationId || `${latitude},${longitude}`,
      );

      return {
        hasAlert: !!alert,
        alert,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to check precipitation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('check-multiple')
  async checkMultiple(@Body() dto: LocationCheckDto) {
    try {
      if (!dto.locations || !Array.isArray(dto.locations)) {
        throw new HttpException(
          'Invalid locations array',
          HttpStatus.BAD_REQUEST,
        );
      }

      const alerts = await this.precipitationService.checkMultipleLocations(
        dto.locations,
      );

      return {
        alerts,
        count: alerts.length,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to check precipitation for multiple locations',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('cooldown/:locationId')
  getCooldownStatus(@Param('locationId') locationId: string) {
    const status = this.precipitationService.getCooldownStatus(locationId);
    return status;
  }

  @Post('cooldown/:locationId/clear')
  clearCooldown(@Param('locationId') locationId: string) {
    this.precipitationService.clearCooldown(locationId);
    return { message: 'Cooldown cleared', locationId };
  }
}
