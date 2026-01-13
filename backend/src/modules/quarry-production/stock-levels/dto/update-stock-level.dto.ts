import { IsOptional, IsDateString, IsString, IsNumber, Min } from 'class-validator';

export class UpdateStockLevelDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  productTypeId?: string;

  @IsOptional()
  @IsString()
  stockpileLocationId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  openingStock?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sold?: number;

  @IsOptional()
  @IsNumber()
  adjustments?: number;

  @IsOptional()
  @IsString()
  adjustmentReason?: string;
}
