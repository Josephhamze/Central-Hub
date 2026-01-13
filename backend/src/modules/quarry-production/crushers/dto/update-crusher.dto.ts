import { IsOptional, IsString, IsNumber, IsEnum, Min } from 'class-validator';
import { EquipmentStatus, CrusherType } from '@prisma/client';

export class UpdateCrusherDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(CrusherType)
  type?: CrusherType;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  ratedCapacity?: number;

  @IsOptional()
  @IsEnum(EquipmentStatus)
  status?: EquipmentStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
