import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TrackingGateway } from '../tracking/tracking.gateway';
import { StartShiftDto } from './dto/start-shift.dto';

const shiftInclude = {
  user: {
    select: {
      id: true,
      name: true,
      username: true,
      role: true,
    },
  },
  trip: {
    include: {
      vehicle: true,
    },
  },
} as const;

@Injectable()
export class ShiftsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly trackingGateway: TrackingGateway,
  ) {}

  async start(dto: StartShiftDto, userId: number) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: dto.tripId },
      include: { crew: true },
    });

    if (!trip) {
      throw new NotFoundException(`ไม่พบ Trip ID ${dto.tripId}`);
    }

    const isCrewMember =
      trip.driverId === userId ||
      trip.crew.some((member) => member.userId === userId);

    if (!isCrewMember) {
      throw new ForbiddenException('คุณไม่ได้อยู่ในทีมงานของเที่ยวนี้');
    }

    const existingShift = await this.prisma.shift.findFirst({
      where: {
        tripId: dto.tripId,
        userId,
        status: { not: 'ENDED' },
      },
    });

    if (existingShift) {
      throw new BadRequestException('คุณมีกะที่ยังทำงานอยู่ในเที่ยวนี้แล้ว');
    }

    const shift = await this.prisma.shift.create({
      data: {
        tripId: dto.tripId,
        userId,
        status: 'ACTIVE',
      },
      include: shiftInclude,
    });

    this.trackingGateway.emitShiftUpdated(shift);

    return shift;
  }

  findActive() {
    return this.prisma.shift.findMany({
      where: { status: { not: 'ENDED' } },
      include: shiftInclude,
      orderBy: { startedAt: 'desc' },
    });
  }

  findAll(tripId?: number) {
    return this.prisma.shift.findMany({
      where: tripId ? { tripId } : undefined,
      include: shiftInclude,
      orderBy: { startedAt: 'desc' },
    });
  }

  private async findOwnedShift(id: number, userId: number) {
    const shift = await this.prisma.shift.findUnique({
      where: { id },
    });

    if (!shift) {
      throw new NotFoundException(`ไม่พบกะการทำงาน ID ${id}`);
    }

    if (shift.userId !== userId) {
      throw new ForbiddenException('แก้ไขได้เฉพาะกะการทำงานของตัวเอง');
    }

    return shift;
  }

  async takeBreak(id: number, userId: number) {
    const shift = await this.findOwnedShift(id, userId);

    if (shift.status !== 'ACTIVE') {
      throw new BadRequestException('เริ่มพักได้เฉพาะกะที่กำลังทำงานอยู่');
    }

    const updated = await this.prisma.shift.update({
      where: { id },
      data: { status: 'ON_BREAK' },
      include: shiftInclude,
    });

    this.trackingGateway.emitShiftUpdated(updated);

    return updated;
  }

  async resume(id: number, userId: number) {
    const shift = await this.findOwnedShift(id, userId);

    if (shift.status !== 'ON_BREAK') {
      throw new BadRequestException('กลับเข้างานได้เฉพาะกะที่กำลังพักอยู่');
    }

    const updated = await this.prisma.shift.update({
      where: { id },
      data: { status: 'ACTIVE' },
      include: shiftInclude,
    });

    this.trackingGateway.emitShiftUpdated(updated);

    return updated;
  }

  async end(id: number, userId: number) {
    const shift = await this.findOwnedShift(id, userId);

    if (shift.status === 'ENDED') {
      throw new BadRequestException('กะนี้จบไปแล้ว');
    }

    const updated = await this.prisma.shift.update({
      where: { id },
      data: { status: 'ENDED', endedAt: new Date() },
      include: shiftInclude,
    });

    this.trackingGateway.emitShiftUpdated(updated);

    return updated;
  }
}
