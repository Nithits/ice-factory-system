import { Module } from '@nestjs/common';
import { IceTanksController } from './ice-tanks.controller';
import { IceTanksService } from './ice-tanks.service';
import { AuthModule } from '../auth/auth.module';
import { TrackingModule } from '../tracking/tracking.module';

@Module({
  imports: [AuthModule, TrackingModule],
  controllers: [IceTanksController],
  providers: [IceTanksService],
})
export class IceTanksModule {}
