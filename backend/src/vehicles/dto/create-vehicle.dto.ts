import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { VehicleStatus } from '../../../generated/prisma/client';

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  plate: string;

  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;
}