import { IsOptional, IsDateString, IsEnum, IsString, IsInt, IsNumber, Min } from 'class-validator';
import { Shift } from '@prisma/client';

export class UpdateExcavatorEntryDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsEnum(Shift)
  shift?: Shift;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  excavatorId?: string;

  @IsOptional()
  @IsString()
  operatorId?: string;

  @IsOptional()
  @IsString()
  materialTypeId?: string;

  @IsOptional()
  @IsString()
  pitLocationId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  bucketCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  downtimeHours?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
