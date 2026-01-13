import { IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';

export class UpdateMaterialTypeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  density?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
