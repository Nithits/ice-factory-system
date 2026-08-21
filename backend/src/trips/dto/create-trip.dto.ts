import {
  ArrayMinSize,
  IsArray,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTripItemDto {
  @IsInt()
  iceProductId: number;

  @IsInt()
  @Min(1)
  loadedQuantity: number;
}

export class CreateTripDto {
  @IsInt()
  vehicleId: number;

  @IsInt()
  driverId: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateTripItemDto)
  items: CreateTripItemDto[];
}