import { Module } from '@nestjs/common';

import { DeliveriesController } from './deliveries.controller';
import { DeliveriesService } from './deliveries.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [DeliveriesController],
  providers: [DeliveriesService],
})
export class DeliveriesModule {}