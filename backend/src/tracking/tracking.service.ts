import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { TrackingGateway } from './tracking.gateway';

@Injectable()
export class TrackingService {
  constructor(
  private readonly prisma: PrismaService,
  private readonly trackingGateway: TrackingGateway,
) {}

  async createLocation(dto: CreateLocationDto) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: dto.vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException(`ไม่พบรถ ID ${dto.vehicleId}`);
    }

    if (dto.tripId) {
      const trip = await this.prisma.trip.findUnique({
        where: { id: dto.tripId },
      });

      if (!trip) {
        throw new NotFoundException(`ไม่พบ Trip ID ${dto.tripId}`);
      }

      if (trip.vehicleId !== dto.vehicleId) {
        throw new BadRequestException(
          'รถคันนี้ไม่ตรงกับรถของเที่ยวการจัดส่ง',
        );
      }
      if (trip.status !== 'IN_PROGRESS') {
        throw new BadRequestException(
            'สามารถบันทึกตำแหน่งได้เฉพาะ Trip ที่กำลังออกส่งเท่านั้น',
        );
        }
    }

    const location = await this.prisma.gpsLog.create({
    data: {
        vehicleId: dto.vehicleId,
        tripId: dto.tripId,
        latitude: dto.latitude,
        longitude: dto.longitude,
        speed: dto.speed,
        accuracy: dto.accuracy,
        heading: dto.heading,
    },
    });

    this.trackingGateway.emitVehicleLocation(location);

    return location;
  }

  async getLatestVehicles() {
    const vehicles = await this.prisma.vehicle.findMany({
      where: {
        status: 'ACTIVE',
      },
    });

    const result = await Promise.all(
      vehicles.map(async (vehicle) => {
        const location = await this.prisma.gpsLog.findFirst({
          where: {
            vehicleId: vehicle.id,
          },
          orderBy: {
            recordedAt: 'desc',
          },
        });

        return {
          ...vehicle,
          location,
        };
      }),
    );

    return result;
  }

  async getTripLocations(tripId: number) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
    });

    if (!trip) {
      throw new NotFoundException(`ไม่พบ Trip ID ${tripId}`);
    }

    return this.prisma.gpsLog.findMany({
      where: {
        tripId,
      },
      orderBy: {
        recordedAt: 'asc',
      },
    });
  }
}