import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { ProblemReportsService } from './problem-reports.service';
import { CreateProblemReportDto } from './dto/create-problem-report.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';
import { ProblemStatus } from '../../generated/prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('problem-reports')
export class ProblemReportsController {
  constructor(private readonly problemReportsService: ProblemReportsService) {}

  @Post()
  create(
    @Body() dto: CreateProblemReportDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.problemReportsService.create(dto, user.sub);
  }

  @Get()
  findAll(
    @Query('status', new ParseEnumPipe(ProblemStatus, { optional: true }))
    status?: ProblemStatus,
  ) {
    return this.problemReportsService.findAll(status);
  }

  @Patch(':id/resolve')
  resolve(@Param('id', ParseIntPipe) id: number) {
    return this.problemReportsService.resolve(id);
  }
}
