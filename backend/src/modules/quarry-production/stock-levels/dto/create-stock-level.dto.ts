import { IsDateString, IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateStockLevelDto {
  @IsDateString()
  date: string;

  @IsString()
  @IsNotEmpty()
  projectId: string;

  @IsString()
  @IsNotEmpty()
  productTypeId: string;

  @IsString()
  @IsNotEmpty()
  stockpileLocationId: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  openingStock?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  sold?: number;

  @IsNumber()
  @IsOptional()
  adjustments?: number;

  @IsString()
  @IsOptional()
  adjustmentReason?: string;
}
