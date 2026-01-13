import { IsOptional, IsDateString, IsEnum, IsString, IsNumber, Min, Max } from 'class-validator';
import { Shift, QualityGrade } from '@prisma/client';

export class UpdateCrusherOutputEntryDto {
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
  productTypeId?: string;

  @IsOptional()
  @IsString()
  stockpileLocationId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  outputTonnage?: number;

  @IsOptional()
  @IsEnum(QualityGrade)
  qualityGrade?: QualityGrade;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  moisturePercentage?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
