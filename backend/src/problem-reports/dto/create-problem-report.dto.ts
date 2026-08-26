import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { ProblemCategory } from '../../../generated/prisma/client';

export class CreateProblemReportDto {
  @IsInt()
  @IsPositive()
  tripId: number;

  @IsOptional()
  @IsEnum(ProblemCategory)
  category?: ProblemCategory;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}
