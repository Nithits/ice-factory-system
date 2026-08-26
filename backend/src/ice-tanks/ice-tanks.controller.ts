import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { IceTanksService } from './ice-tanks.service';
import { CreateIceTankDto } from './dto/create-ice-tank.dto';
import { UpdateIceTankDto } from './dto/update-ice-tank.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('ice-tanks')
export class IceTanksController {
  constructor(private readonly iceTanksService: IceTanksService) {}

  @Post()
  create(@Body() dto: CreateIceTankDto) {
    return this.iceTanksService.create(dto);
  }

  @Get()
  findAll(
    @Query('customerId', new ParseIntPipe({ optional: true }))
    customerId?: number,
  ) {
    return this.iceTanksService.findAll(customerId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.iceTanksService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateIceTankDto) {
    return this.iceTanksService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.iceTanksService.remove(id);
  }
}
