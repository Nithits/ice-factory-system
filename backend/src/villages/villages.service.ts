import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVillageDto } from './dto/create-village.dto';
import { UpdateVillageDto } from './dto/update-village.dto';

@Injectable()
export class VillagesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateVillageDto) {
    const zone = await this.prisma.zone.findUnique({
      where: { id: dto.zoneId },
    });

    if (!zone) {
      throw new NotFoundException(`ไม่พบโซน ID ${dto.zoneId}`);
    }

    return this.prisma.village.create({
      data: dto,
    });
  }

  findAll(zoneId?: number) {
    return this.prisma.village.findMany({
      where: zoneId ? { zoneId } : undefined,
      include: {
        zone: true,
        _count: {
          select: { customers: true },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: number) {
    const village = await this.prisma.village.findUnique({
      where: { id },
      include: {
        zone: true,
        customers: {
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!village) {
      throw new NotFoundException(`ไม่พบหมู่บ้าน ID ${id}`);
    }

    return village;
  }

  async update(id: number, dto: UpdateVillageDto) {
    await this.findOne(id);

    if (dto.zoneId) {
      const zone = await this.prisma.zone.findUnique({
        where: { id: dto.zoneId },
      });

      if (!zone) {
        throw new NotFoundException(`ไม่พบโซน ID ${dto.zoneId}`);
      }
    }

    return this.prisma.village.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    const customerCount = await this.prisma.customer.count({
      where: { villageId: id },
    });

    if (customerCount > 0) {
      throw new BadRequestException(
        'ต้องลบร้านค้าในหมู่บ้านนี้ออกให้หมดก่อนจึงจะลบหมู่บ้านได้',
      );
    }

    return this.prisma.village.delete({
      where: { id },
    });
  }
}
