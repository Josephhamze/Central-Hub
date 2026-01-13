import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
import { EquipmentStatus, CrusherType } from '@prisma/client';

export class CreateCrusherDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(CrusherType)
  type: CrusherType;

  @IsNumber()
  @Min(0.01)
  ratedCapacity: number;

  @IsEnum(EquipmentStatus)
  @IsOptional()
  status?: EquipmentStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}
