import { Module } from '@nestjs/common';
import { IceProductsController } from './ice-products.controller';
import { IceProductsService } from './ice-products.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [IceProductsController],
  providers: [IceProductsService],
})
export class IceProductsModule {}