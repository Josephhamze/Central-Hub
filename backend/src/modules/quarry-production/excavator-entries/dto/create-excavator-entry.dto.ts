import { IsDateString, IsEnum, IsString, IsNotEmpty, IsInt, IsOptional, IsNumber, Min } from 'class-validator';
import { Shift } from '@prisma/client';

export class CreateExcavatorEntryDto {
  @IsDateString()
  date: string;

  @IsEnum(Shift)
  shift: Shift;

  @IsString()
  @IsNotEmpty()
  projectId: string;

  @IsString()
  @IsNotEmpty()
  excavatorId: string;

  @IsString()
  @IsNotEmpty()
  operatorId: string;

  @IsString()
  @IsNotEmpty()
  materialTypeId: string;

  @IsString()
  @IsNotEmpty()
  pitLocationId: string;

  @IsInt()
  @Min(1)
  bucketCount: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  downtimeHours?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
