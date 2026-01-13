import { IsDateString, IsEnum, IsString, IsNotEmpty, IsInt, IsOptional, IsNumber, Min } from 'class-validator';
import { Shift } from '@prisma/client';

export class CreateHaulingEntryDto {
  @IsDateString()
  date: string;

  @IsEnum(Shift)
  shift: Shift;

  @IsString()
  @IsNotEmpty()
  projectId: string;

  @IsString()
  @IsNotEmpty()
  truckId: string;

  @IsString()
  @IsNotEmpty()
  driverId: string;

  @IsString()
  @IsOptional()
  excavatorEntryId?: string;

  @IsInt()
  @Min(1)
  tripCount: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  avgCycleTime?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  fuelConsumption?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
