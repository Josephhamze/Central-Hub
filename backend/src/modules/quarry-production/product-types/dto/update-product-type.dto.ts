import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdateProductTypeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
