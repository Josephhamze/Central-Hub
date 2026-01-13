import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdateStockpileLocationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
