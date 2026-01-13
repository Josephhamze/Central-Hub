import { IsNumber, IsNotEmpty, IsString, IsOptional, Min } from 'class-validator';

export class AdjustStockDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  adjustments: number;

  @IsString()
  @IsNotEmpty()
  adjustmentReason: string;
}
