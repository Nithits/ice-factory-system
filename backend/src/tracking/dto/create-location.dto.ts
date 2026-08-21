import { IsInt, IsNumber, IsOptional } from 'class-validator';

export class CreateLocationDto {
  @IsInt()
  vehicleId!: number;

  @IsOptional()
  @IsInt()
  tripId?: number;

  @IsNumber()
  latitude!: number;

  @IsNumber()
  longitude!: number;

  @IsOptional()
  @IsNumber()
  speed?: number;

  @IsOptional()
  @IsNumber()
  accuracy?: number;

  @IsOptional()
  @IsNumber()
  heading?: number;
}