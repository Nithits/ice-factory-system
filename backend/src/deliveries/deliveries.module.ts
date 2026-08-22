import { Module } from '@nestjs/common';

import { DeliveriesController } from './deliveries.controller';
import { DeliveriesService } from './deliveries.service';
import { AuthModule } from '../auth/auth.module';
import { TrackingModule } from '../tracking/tracking.module';

@Module({
  imports: [AuthModule, TrackingModule],
  controllers: [DeliveriesController],
  providers: [DeliveriesService],
})
export class DeliveriesModule {}