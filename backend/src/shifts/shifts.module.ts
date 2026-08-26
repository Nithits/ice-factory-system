import { Module } from '@nestjs/common';
import { ShiftsController } from './shifts.controller';
import { ShiftsService } from './shifts.service';
import { AuthModule } from '../auth/auth.module';
import { TrackingModule } from '../tracking/tracking.module';

@Module({
  imports: [AuthModule, TrackingModule],
  controllers: [ShiftsController],
  providers: [ShiftsService],
})
export class ShiftsModule {}
