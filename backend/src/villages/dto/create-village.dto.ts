import { IsInt, IsNotEmpty, IsPositive, IsString } from 'class-validator';

export class CreateVillageDto {
  @IsInt()
  @IsPositive()
  zoneId: number;

  @IsString()
  @IsNotEmpty()
  name: string;
}
