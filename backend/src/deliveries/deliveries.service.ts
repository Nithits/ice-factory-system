import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { TrackingGateway } from '../tracking/tracking.gateway';

@Injectable()
export class DeliveriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly trackingGateway: TrackingGateway,
  ) {}

  async create(dto: CreateDeliveryDto) {
    const trip = await this.prisma.trip.findUnique({
      where: {
        id: dto.tripId,
      },
      include: {
        items: true,
      },
    });

    if (!trip) {
      throw new NotFoundException(`ไม่พบ Trip ID ${dto.tripId}`);
    }

    if (trip.status !== 'IN_PROGRESS') {
      throw new BadRequestException(
        'Trip นี้ยังไม่ได้เริ่มออกส่ง หรือจบงานแล้ว',
      );
    }

    let deliveryTotal = 0;

    for (const item of dto.items) {
      const tripItem = trip.items.find(
        (t) => t.iceProductId === item.iceProductId,
      );

      if (!tripItem) {
        throw new BadRequestException(
          `ไม่มีสินค้าน้ำแข็ง ID ${item.iceProductId} อยู่ในรถคันนี้`,
        );
      }

      if (item.quantity > tripItem.remainingQuantity) {
        throw new BadRequestException(
          `น้ำแข็ง ID ${item.iceProductId} คงเหลือไม่พอ เหลือ ${tripItem.remainingQuantity} กระสอบ`,
        );
      }

      deliveryTotal += item.quantity * item.unitPrice;
    }

    const delivery = await this.prisma.$transaction(async (tx) => {
      const delivery = await tx.delivery.create({
        data: {
          tripId: dto.tripId,
          customerName: dto.customerName,
          village: dto.village,
          latitude: dto.latitude,
          longitude: dto.longitude,
          totalAmount: deliveryTotal,
          paymentStatus: 'PENDING',

          items: {
            create: dto.items.map((item) => ({
              iceProductId: item.iceProductId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.quantity * item.unitPrice,
            })),
          },
        },

        include: {
          items: {
            include: {
              iceProduct: true,
            },
          },
        },
      });

      for (const item of dto.items) {
        await tx.tripItem.update({
          where: {
            tripId_iceProductId: {
              tripId: dto.tripId,
              iceProductId: item.iceProductId,
            },
          },

          data: {
            deliveredQuantity: {
              increment: item.quantity,
            },

            remainingQuantity: {
              decrement: item.quantity,
            },
          },
        });
      }

      await tx.trip.update({
        where: {
          id: dto.tripId,
        },

        data: {
          totalAmount: {
            increment: deliveryTotal,
          },
        },
      });

      return delivery;
    });

    this.trackingGateway.emitDeliveryCreated(delivery);

    return delivery;
  }

  findAll() {
    return this.prisma.delivery.findMany({
      include: {
        trip: {
          include: {
            vehicle: true,
            driver: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },

        items: {
          include: {
            iceProduct: true,
          },
        },
      },

      orderBy: {
        id: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const delivery = await this.prisma.delivery.findUnique({
      where: {
        id,
      },

      include: {
        trip: {
          include: {
            vehicle: true,
            driver: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },

        items: {
          include: {
            iceProduct: true,
          },
        },
      },
    });

    if (!delivery) {
      throw new NotFoundException(`ไม่พบ Delivery ID ${id}`);
    }

    return delivery;
  }
}