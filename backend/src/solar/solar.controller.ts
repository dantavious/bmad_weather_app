import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Logger } from '@nestjs/common';
import { SolarService } from './solar.service';
import { SolarIrradianceDto, SolarIrradianceResponseDto } from './dto/solar-calculation.dto';
import { RateLimitGuard } from '../common/guards/rate-limit.guard';

@Controller('api/solar')
@UseGuards(RateLimitGuard)
export class SolarController {
  private readonly logger = new Logger(SolarController.name);

  constructor(private readonly solarService: SolarService) {}

  @Post('irradiance')
  @HttpCode(HttpStatus.OK)
  async getSolarIrradiance(
    @Body() dto: SolarIrradianceDto
  ): Promise<SolarIrradianceResponseDto> {
    this.logger.log(`Getting solar irradiance for lat: ${dto.latitude}, lon: ${dto.longitude}`);
    
    try {
      const result = await this.solarService.getSolarIrradiance(dto);
      return result;
    } catch (error) {
      this.logger.error('Error calculating solar irradiance:', error);
      throw error;
    }
  }
}