import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NwsService } from './nws.service';
import { NwsController } from './nws.controller';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
  ],
  controllers: [NwsController],
  providers: [NwsService],
  exports: [NwsService],
})
export class NwsModule {}