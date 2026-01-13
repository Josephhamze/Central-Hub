import { IsOptional, IsString, IsNumber, IsEnum, Min } from 'class-validator';
import { EquipmentStatus } from '@prisma/client';

export class UpdateExcavatorDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  bucketCapacity?: number;

  @IsOptional()
  @IsEnum(EquipmentStatus)
  status?: EquipmentStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
