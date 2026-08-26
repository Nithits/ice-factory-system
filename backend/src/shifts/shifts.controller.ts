import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { ShiftsService } from './shifts.service';
import { StartShiftDto } from './dto/start-shift.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('shifts')
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Post()
  start(@Body() dto: StartShiftDto, @CurrentUser() user: AuthenticatedUser) {
    return this.shiftsService.start(dto, user.sub);
  }

  @Get('active')
  findActive() {
    return this.shiftsService.findActive();
  }

  @Get()
  findAll(
    @Query('tripId', new ParseIntPipe({ optional: true })) tripId?: number,
  ) {
    return this.shiftsService.findAll(tripId);
  }

  @Patch(':id/break')
  takeBreak(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.shiftsService.takeBreak(id, user.sub);
  }

  @Patch(':id/resume')
  resume(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.shiftsService.resume(id, user.sub);
  }

  @Patch(':id/end')
  end(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.shiftsService.end(id, user.sub);
  }
}
