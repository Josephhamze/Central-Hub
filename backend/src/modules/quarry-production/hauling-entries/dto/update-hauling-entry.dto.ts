import { IsOptional, IsDateString, IsEnum, IsString, IsInt, IsNumber, Min } from 'class-validator';
import { Shift } from '@prisma/client';

export class UpdateHaulingEntryDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsEnum(Shift)
  shift?: Shift;

  @IsOptional()
  @IsString()
  truckId?: string;

  @IsOptional()
  @IsString()
  driverId?: string;

  @IsOptional()
  @IsString()
  excavatorEntryId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  tripCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  avgCycleTime?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fuelConsumption?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
