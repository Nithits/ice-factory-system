import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS สำหรับ Web / Mobile development
  // อนุญาต localhost/127.0.0.1 ทุกพอร์ต เพราะ Expo (8081/8082/...) และ
  // Next.js (3001/3002/...) อาจสลับพอร์ตเองเวลาพอร์ตเดิมถูกใช้งานอยู่แล้ว
  const devOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/;

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || devOriginPattern.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.listen(3000, '0.0.0.0');

  console.log('Backend running on port 3000');
}

bootstrap();