import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateStockpileLocationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
