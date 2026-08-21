import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { TripsService } from './trips.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Post()
  create(@Body() dto: CreateTripDto) {
    return this.tripsService.create(dto);
  }

  @Get()
  findAll() {
    return this.tripsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tripsService.findOne(id);
  }
  @Patch(':id/start')
    startTrip(@Param('id', ParseIntPipe) id: number) {
    return this.tripsService.startTrip(id);
    }
  @Patch(':id/complete')
    completeTrip(@Param('id', ParseIntPipe) id: number) {
    return this.tripsService.completeTrip(id);
    }

}