import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TrackingGateway } from '../tracking/tracking.gateway';
import { CreateIceTankDto } from './dto/create-ice-tank.dto';
import { UpdateIceTankDto } from './dto/update-ice-tank.dto';

@Injectable()
export class IceTanksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly trackingGateway: TrackingGateway,
  ) {}

  async create(dto: CreateIceTankDto) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });

    if (!customer) {
      throw new NotFoundException(`ไม่พบร้านค้า ID ${dto.customerId}`);
    }

    const tank = await this.prisma.iceTank.create({
      data: {
        customerId: dto.customerId,
        size: dto.size,
        quantity: dto.quantity ?? 1,
        status: dto.status ?? 'NORMAL',
      },
    });

    this.trackingGateway.emitTankUpdated(tank);

    return tank;
  }

  findAll(customerId?: number) {
    return this.prisma.iceTank.findMany({
      where: customerId ? { customerId } : undefined,
      include: { customer: true },
      orderBy: { id: 'desc' },
    });
  }

  async findOne(id: number) {
    const tank = await this.prisma.iceTank.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!tank) {
      throw new NotFoundException(`ไม่พบถังน้ำแข็ง ID ${id}`);
    }

    return tank;
  }

  async update(id: number, dto: UpdateIceTankDto) {
    await this.findOne(id);

    const tank = await this.prisma.iceTank.update({
      where: { id },
      data: dto,
    });

    this.trackingGateway.emitTankUpdated(tank);

    return tank;
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.iceTank.delete({
      where: { id },
    });
  }
}
