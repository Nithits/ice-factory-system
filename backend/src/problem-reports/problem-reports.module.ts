import { Module } from '@nestjs/common';
import { ProblemReportsController } from './problem-reports.controller';
import { ProblemReportsService } from './problem-reports.service';
import { AuthModule } from '../auth/auth.module';
import { TrackingModule } from '../tracking/tracking.module';

@Module({
  imports: [AuthModule, TrackingModule],
  controllers: [ProblemReportsController],
  providers: [ProblemReportsService],
})
export class ProblemReportsModule {}
