import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../../generated/prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const adapter = new PrismaMariaDb({
      host: process.env.DATABASE_HOST || 'localhost',
      port: Number(process.env.DATABASE_PORT || 3306),
      user: process.env.DATABASE_USER || 'ice_user',
      password: process.env.DATABASE_PASSWORD || 'ice_password',
      database: process.env.DATABASE_NAME || 'ice_factory',
      connectionLimit: 5,
      // MySQL 8+ ใช้ caching_sha2_password เป็นค่าเริ่มต้น ซึ่งต้องขอ RSA
      // public key จาก server ตอนไม่ได้เชื่อมด้วย SSL — ถ้าไม่เปิดตัวนี้
      // การเชื่อมต่อจะล้มเหลวเป็นระยะๆ ด้วย "RSA public key is not available"
      allowPublicKeyRetrieval: true,
    });

    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}