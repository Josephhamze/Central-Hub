import { IsOptional, IsDateString, IsEnum, IsString, IsInt, IsNumber, Min } from 'class-validator';
import { Shift } from '@prisma/client';

export class UpdateCrusherFeedEntryDto {
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
  crusherId?: string;

  @IsOptional()
  @IsString()
  materialTypeId?: string;

  @IsOptional()
  @IsDateString()
  feedStartTime?: string;

  @IsOptional()
  @IsDateString()
  feedEndTime?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  truckLoadsReceived?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weighBridgeTonnage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  rejectOversizeTonnage?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
