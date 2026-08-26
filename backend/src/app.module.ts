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
import { ZonesModule } from './zones/zones.module';
import { VillagesModule } from './villages/villages.module';
import { CustomersModule } from './customers/customers.module';
import { IceTanksModule } from './ice-tanks/ice-tanks.module';
import { ShiftsModule } from './shifts/shifts.module';
import { ProblemReportsModule } from './problem-reports/problem-reports.module';

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
    ZonesModule,
    VillagesModule,
    CustomersModule,
    IceTanksModule,
    ShiftsModule,
    ProblemReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
