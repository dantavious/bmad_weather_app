import { Module } from '@nestjs/common';
import { ActivityController } from './controllers/activity.controller';
import { ActivityService } from './services/activity.service';
import { ActivityCalculatorService } from './services/activity-calculator.service';
import { WeatherModule } from '../weather/weather.module';

@Module({
  imports: [WeatherModule],
  controllers: [ActivityController],
  providers: [ActivityService, ActivityCalculatorService],
  exports: [ActivityService],
})
export class ActivitiesModule {}
