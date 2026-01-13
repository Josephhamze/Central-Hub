import { IsDateString, IsEnum, IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Shift, QualityGrade } from '@prisma/client';

export class CreateCrusherOutputEntryDto {
  @IsDateString()
  date: string;

  @IsEnum(Shift)
  shift: Shift;

  @IsString()
  @IsNotEmpty()
  projectId: string;

  @IsString()
  @IsNotEmpty()
  crusherId: string;

  @IsString()
  @IsNotEmpty()
  productTypeId: string;

  @IsString()
  @IsNotEmpty()
  stockpileLocationId: string;

  @IsNumber()
  @Min(0)
  outputTonnage: number;

  @IsEnum(QualityGrade)
  qualityGrade: QualityGrade;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  moisturePercentage?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
