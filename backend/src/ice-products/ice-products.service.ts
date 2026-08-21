import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIceProductDto } from './dto/create-ice-product.dto';
import { UpdateIceProductDto } from './dto/update-ice-product.dto';

@Injectable()
export class IceProductsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateIceProductDto) {
    return this.prisma.iceProduct.create({
      data: {
        name: dto.name,
        unit: dto.unit ?? 'กระสอบ',
        price: dto.price,
        isActive: dto.isActive ?? true,
      },
    });
  }

  findAll() {
    return this.prisma.iceProduct.findMany({
      orderBy: {
        id: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const product = await this.prisma.iceProduct.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`ไม่พบสินค้าน้ำแข็ง ID ${id}`);
    }

    return product;
  }

  async update(id: number, dto: UpdateIceProductDto) {
    await this.findOne(id);

    return this.prisma.iceProduct.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.iceProduct.delete({
      where: { id },
    });
  }
}