import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateVehicleDto) {
    return this.prisma.vehicle.create({
      data: dto,
    });
  }

  findAll() {
    return this.prisma.vehicle.findMany({
      orderBy: {
        id: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      throw new NotFoundException(`ไม่พบรถ ID ${id}`);
    }

    return vehicle;
  }

  async update(id: number, dto: UpdateVehicleDto) {
    await this.findOne(id);

    return this.prisma.vehicle.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.vehicle.delete({
      where: { id },
    });
  }
}