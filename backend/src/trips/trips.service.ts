import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { TrackingGateway } from '../tracking/tracking.gateway';

const tripInclude = {
  vehicle: true,

  driver: {
    select: {
      id: true,
      name: true,
      username: true,
      role: true,
    },
  },

  crew: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          role: true,
        },
      },
    },
  },

  items: {
    include: {
      iceProduct: true,
    },
  },
} as const;

@Injectable()
export class TripsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly trackingGateway: TrackingGateway,
  ) {}

  async create(dto: CreateTripDto) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: dto.vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException('ไม่พบรถ');
    }

    const driver = await this.prisma.user.findUnique({
      where: { id: dto.driverId },
    });

    if (!driver) {
      throw new NotFoundException('ไม่พบคนขับ');
    }

    if (driver.role !== 'DRIVER') {
      throw new BadRequestException('ผู้ใช้นี้ไม่ใช่คนขับรถ');
    }

    const helperIds = (dto.helperIds ?? []).filter(
      (helperId) => helperId !== dto.driverId,
    );

    for (const helperId of helperIds) {
      const helper = await this.prisma.user.findUnique({
        where: { id: helperId },
      });

      if (!helper) {
        throw new NotFoundException(`ไม่พบผู้ช่วยคนขับ ID ${helperId}`);
      }

      if (helper.role !== 'DRIVER') {
        throw new BadRequestException('ผู้ช่วยคนขับต้องเป็นบัญชีพนักงานขับรถ');
      }
    }

    for (const item of dto.items) {
      const product = await this.prisma.iceProduct.findUnique({
        where: { id: item.iceProductId },
      });

      if (!product) {
        throw new NotFoundException(
          `ไม่พบสินค้าน้ำแข็ง ID ${item.iceProductId}`,
        );
      }
    }

    const trip = await this.prisma.trip.create({
      data: {
        vehicleId: dto.vehicleId,
        driverId: dto.driverId,
        status: 'LOADING',

        crew: {
          create: [
            { userId: dto.driverId, roleOnTrip: 'DRIVER' },
            ...helperIds.map((userId) => ({
              userId,
              roleOnTrip: 'HELPER' as const,
            })),
          ],
        },

        items: {
          create: dto.items.map((item) => ({
            iceProductId: item.iceProductId,
            loadedQuantity: item.loadedQuantity,
            deliveredQuantity: 0,
            remainingQuantity: item.loadedQuantity,
          })),
        },
      },

      include: tripInclude,
    });

    this.trackingGateway.emitTripUpdated(trip);

    return trip;
  }

  findAll() {
    return this.prisma.trip.findMany({
      include: tripInclude,

      orderBy: {
        id: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const trip = await this.prisma.trip.findUnique({
      where: { id },
      include: tripInclude,
    });

    if (!trip) {
      throw new NotFoundException(`ไม่พบ Trip ID ${id}`);
    }

    return trip;
  }

  async startTrip(id: number) {
    const trip = await this.prisma.trip.findUnique({
      where: { id },

      include: {
        vehicle: true,
        items: true,
      },
    });

    if (!trip) {
      throw new NotFoundException(`ไม่พบ Trip ID ${id}`);
    }

    if (trip.status !== 'LOADING') {
      throw new BadRequestException('Trip นี้ไม่อยู่ในสถานะเตรียมโหลด');
    }

    if (trip.items.length === 0) {
      throw new BadRequestException(
        'ต้องมีน้ำแข็งอย่างน้อย 1 รายการก่อนออกส่ง',
      );
    }

    const updatedTrip = await this.prisma.$transaction(async (tx) => {
      const updatedTrip = await tx.trip.update({
        where: { id },

        data: {
          status: 'IN_PROGRESS',
          startTime: new Date(),
        },

        include: tripInclude,
      });

      await tx.vehicle.update({
        where: {
          id: trip.vehicleId,
        },

        data: {
          status: 'ACTIVE',
        },
      });

      return updatedTrip;
    });

    this.trackingGateway.emitTripUpdated(updatedTrip);

    return updatedTrip;
  }

  async completeTrip(id: number, requestingUserId: number) {
    const trip = await this.prisma.trip.findUnique({
      where: { id },
      include: {
        items: true,
        vehicle: true,
      },
    });

    if (!trip) {
      throw new NotFoundException(`ไม่พบ Trip ID ${id}`);
    }

    if (trip.driverId !== requestingUserId) {
      throw new ForbiddenException(
        'เฉพาะคนขับหลักของเที่ยวนี้เท่านั้นที่ปิดเที่ยว/นำรถกลับโรงงานได้',
      );
    }

    if (trip.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Trip นี้ไม่ได้อยู่ในสถานะกำลังออกส่ง');
    }

    const updatedTrip = await this.prisma.$transaction(async (tx) => {
      const updatedTrip = await tx.trip.update({
        where: { id },

        data: {
          status: 'COMPLETED',
          endTime: new Date(),
        },

        include: {
          ...tripInclude,

          deliveries: {
            include: {
              items: {
                include: {
                  iceProduct: true,
                },
              },
            },
          },
        },
      });

      await tx.vehicle.update({
        where: {
          id: trip.vehicleId,
        },

        data: {
          status: 'ACTIVE',
        },
      });

      return updatedTrip;
    });

    this.trackingGateway.emitTripUpdated(updatedTrip);

    return updatedTrip;
  }
}
