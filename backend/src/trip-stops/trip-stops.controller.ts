import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { TripStopsService } from './trip-stops.service';
import { CreateTripStopDto } from './dto/create-trip-stop.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('trip-stops')
export class TripStopsController {
  constructor(private readonly tripStopsService: TripStopsService) {}

  @Post()
  create(
    @Body() dto: CreateTripStopDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tripStopsService.create(dto, user.sub);
  }

  @Get()
  findByTrip(
    @Query('tripId', new ParseIntPipe({ optional: true })) tripId?: number,
  ) {
    return this.tripStopsService.findByTrip(tripId);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tripStopsService.remove(id);
  }
}
