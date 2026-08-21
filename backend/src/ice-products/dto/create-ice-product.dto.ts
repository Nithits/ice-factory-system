import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateIceProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}