import { IsInt, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateTripStopDto {
  @IsInt()
  @IsPositive()
  tripId: number;

  @IsInt()
  @IsPositive()
  customerId: number;

  @IsOptional()
  @IsString()
  note?: string;
}
