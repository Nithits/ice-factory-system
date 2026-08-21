import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { IceProductsService } from './ice-products.service';
import { CreateIceProductDto } from './dto/create-ice-product.dto';
import { UpdateIceProductDto } from './dto/update-ice-product.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('ice-products')
export class IceProductsController {
  constructor(
    private readonly iceProductsService: IceProductsService,
  ) {}

  @Post()
  create(@Body() dto: CreateIceProductDto) {
    return this.iceProductsService.create(dto);
  }

  @Get()
  findAll() {
    return this.iceProductsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.iceProductsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateIceProductDto,
  ) {
    return this.iceProductsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.iceProductsService.remove(id);
  }
}