import {
  Controller,
  Get,
  Query,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { SearchService } from '../services/search.service';
import { LocationSearchResult } from '@shared/models/location.model';
import { RateLimitGuard } from '../../weather/guards/rate-limit.guard';

@Controller('api/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('location')
  @UseGuards(RateLimitGuard)
  async searchLocation(
    @Query('q') query: string,
  ): Promise<LocationSearchResult[]> {
    if (!query || query.length < 3) {
      throw new HttpException(
        'Query parameter must be at least 3 characters long',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.searchService.searchLocation(query);
  }
}
