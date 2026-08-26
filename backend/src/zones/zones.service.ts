import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';

@Injectable()
export class ZonesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateZoneDto) {
    return this.prisma.zone.create({
      data: dto,
    });
  }

  findAll() {
    return this.prisma.zone.findMany({
      include: {
        _count: {
          select: { villages: true },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: number) {
    const zone = await this.prisma.zone.findUnique({
      where: { id },
      include: {
        villages: {
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!zone) {
      throw new NotFoundException(`ไม่พบโซน ID ${id}`);
    }

    return zone;
  }

  async update(id: number, dto: UpdateZoneDto) {
    await this.findOne(id);

    return this.prisma.zone.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    const villageCount = await this.prisma.village.count({
      where: { zoneId: id },
    });

    if (villageCount > 0) {
      throw new BadRequestException(
        'ต้องลบหมู่บ้านในโซนนี้ออกให้หมดก่อนจึงจะลบโซนได้',
      );
    }

    return this.prisma.zone.delete({
      where: { id },
    });
  }
}
