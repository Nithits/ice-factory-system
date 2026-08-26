import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TrackingGateway } from '../tracking/tracking.gateway';
import { CreateProblemReportDto } from './dto/create-problem-report.dto';
import { ProblemStatus } from '../../generated/prisma/client';

const reportInclude = {
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
export class ProblemReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly trackingGateway: TrackingGateway,
  ) {}

  async create(dto: CreateProblemReportDto, userId: number) {
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

    const report = await this.prisma.problemReport.create({
      data: {
        tripId: dto.tripId,
        userId,
        category: dto.category ?? 'OTHER',
        description: dto.description,
        latitude: dto.latitude,
        longitude: dto.longitude,
      },
      include: reportInclude,
    });

    this.trackingGateway.emitProblemReported(report);

    return report;
  }

  findAll(status?: ProblemStatus) {
    return this.prisma.problemReport.findMany({
      where: status ? { status } : undefined,
      include: reportInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolve(id: number) {
    const report = await this.prisma.problemReport.findUnique({
      where: { id },
    });

    if (!report) {
      throw new NotFoundException(`ไม่พบรายงานปัญหา ID ${id}`);
    }

    return this.prisma.problemReport.update({
      where: { id },
      data: { status: 'RESOLVED' },
      include: reportInclude,
    });
  }
}
