import { Module } from '@nestjs/common';

import { TripStopsController } from './trip-stops.controller';
import { TripStopsService } from './trip-stops.service';
import { AuthModule } from '../auth/auth.module';
import { TrackingModule } from '../tracking/tracking.module';

@Module({
  imports: [AuthModule, TrackingModule],
  controllers: [TripStopsController],
  providers: [TripStopsService],
})
export class TripStopsModule {}
