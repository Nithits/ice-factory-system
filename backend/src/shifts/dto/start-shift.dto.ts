import { IsInt, IsPositive } from 'class-validator';

export class StartShiftDto {
  @IsInt()
  @IsPositive()
  tripId: number;
}
