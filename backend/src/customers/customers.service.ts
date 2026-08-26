import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TrackingGateway } from '../tracking/tracking.gateway';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly trackingGateway: TrackingGateway,
  ) {}

  async create(dto: CreateCustomerDto) {
    const village = await this.prisma.village.findUnique({
      where: { id: dto.villageId },
    });

    if (!village) {
      throw new NotFoundException(`ไม่พบหมู่บ้าน ID ${dto.villageId}`);
    }

    const customer = await this.prisma.customer.create({
      data: dto,
      include: {
        village: { include: { zone: true } },
      },
    });

    this.trackingGateway.emitCustomerAdded(customer);

    return customer;
  }

  findAll(villageId?: number) {
    return this.prisma.customer.findMany({
      where: villageId ? { villageId } : undefined,
      include: {
        village: { include: { zone: true } },
        _count: { select: { iceTanks: true } },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: number) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        village: { include: { zone: true } },
        iceTanks: true,
      },
    });

    if (!customer) {
      throw new NotFoundException(`ไม่พบร้านค้า ID ${id}`);
    }

    return customer;
  }

  async update(id: number, dto: UpdateCustomerDto) {
    await this.findOne(id);

    if (dto.villageId) {
      const village = await this.prisma.village.findUnique({
        where: { id: dto.villageId },
      });

      if (!village) {
        throw new NotFoundException(`ไม่พบหมู่บ้าน ID ${dto.villageId}`);
      }
    }

    return this.prisma.customer.update({
      where: { id },
      data: dto,
      include: {
        village: { include: { zone: true } },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.customer.delete({
      where: { id },
    });
  }
}
