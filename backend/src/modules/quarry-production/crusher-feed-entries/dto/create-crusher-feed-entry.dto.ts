import { IsDateString, IsEnum, IsString, IsNotEmpty, IsInt, IsOptional, IsNumber, Min } from 'class-validator';
import { Shift } from '@prisma/client';

export class CreateCrusherFeedEntryDto {
  @IsDateString()
  date: string;

  @IsEnum(Shift)
  shift: Shift;

  @IsString()
  @IsNotEmpty()
  crusherId: string;

  @IsString()
  @IsNotEmpty()
  materialTypeId: string;

  @IsDateString()
  feedStartTime: string;

  @IsDateString()
  feedEndTime: string;

  @IsInt()
  @Min(0)
  truckLoadsReceived: number;

  @IsNumber()
  @Min(0)
  weighBridgeTonnage: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  rejectOversizeTonnage?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
