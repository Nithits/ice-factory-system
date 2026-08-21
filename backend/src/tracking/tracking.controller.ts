import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Post('location')
  createLocation(@Body() dto: CreateLocationDto) {
    return this.trackingService.createLocation(dto);
  }

  @Get('vehicles')
  getLatestVehicles() {
    return this.trackingService.getLatestVehicles();
  }

  @Get('trips/:tripId')
  getTripLocations(
    @Param('tripId', ParseIntPipe) tripId: number,
  ) {
    return this.trackingService.getTripLocations(tripId);
  }
}