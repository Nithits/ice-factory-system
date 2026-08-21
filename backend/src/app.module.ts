import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from './prisma/prisma.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { IceProductsModule } from './ice-products/ice-products.module';
import { TripsModule } from './trips/trips.module';
import { DeliveriesModule } from './deliveries/deliveries.module';
import { TrackingModule } from './tracking/tracking.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    PrismaModule,
    VehiclesModule,
    UsersModule,
    AuthModule,
    IceProductsModule,
    TripsModule,
    DeliveriesModule,
    TrackingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}