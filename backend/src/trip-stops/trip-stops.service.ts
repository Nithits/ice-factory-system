import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { TrackingGateway } from '../tracking/tracking.gateway';
import { CreateTripStopDto } from './dto/create-trip-stop.dto';

const stopInclude = {
  customer: {
    include: {
      village: { include: { zone: true } },
    },
  },
} as const;

@Injectable()
export class TripStopsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly trackingGateway: TrackingGateway,
  ) {}

  async create(dto: CreateTripStopDto, createdById: number) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: dto.tripId },
    });

    if (!trip) {
      throw new NotFoundException(`ไม่พบ Trip ID ${dto.tripId}`);
    }

    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });

    if (!customer) {
      throw new NotFoundException(`ไม่พบร้านค้า ID ${dto.customerId}`);
    }

    const existing = await this.prisma.tripStop.findUnique({
      where: {
        tripId_customerId: {
          tripId: dto.tripId,
          customerId: dto.customerId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('ร้านค้านี้ถูกมอบหมายให้เที่ยวนี้อยู่แล้ว');
    }

    const stop = await this.prisma.tripStop.create({
      data: {
        tripId: dto.tripId,
        customerId: dto.customerId,
        note: dto.note,
        createdById,
      },
      include: stopInclude,
    });

    this.trackingGateway.emitTripStopUpdated(stop);

    return stop;
  }

  findByTrip(tripId?: number) {
    return this.prisma.tripStop.findMany({
      where: tripId ? { tripId } : undefined,
      include: stopInclude,
      orderBy: { id: 'asc' },
    });
  }

  async remove(id: number) {
    const stop = await this.prisma.tripStop.findUnique({ where: { id } });

    if (!stop) {
      throw new NotFoundException(`ไม่พบรายการ ID ${id}`);
    }

    await this.prisma.tripStop.delete({ where: { id } });

    this.trackingGateway.emitTripStopUpdated({
      id,
      tripId: stop.tripId,
      removed: true,
    });

    return { id };
  }
}
