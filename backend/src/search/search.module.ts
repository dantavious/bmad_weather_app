import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { SearchController } from './controllers/search.controller';
import { SearchService } from './services/search.service';
import { CacheService } from '../weather/services/cache.service';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [SearchController],
  providers: [SearchService, CacheService],
  exports: [SearchService],
})
export class SearchModule {}
