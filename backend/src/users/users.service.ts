import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });

    if (existingUser) {
      throw new ConflictException('Username นี้ถูกใช้งานแล้ว');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        username: dto.username,
        password: hashedPassword,
        phone: dto.phone,
        role: dto.role ?? 'DRIVER',
      },
    });

    // ห้ามส่ง password กลับไปยัง Mobile App
    const { password, ...result } = user;

    return result;
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        id: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        username: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`ไม่พบผู้ใช้ ID ${id}`);
    }

    return user;
  }

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }
}