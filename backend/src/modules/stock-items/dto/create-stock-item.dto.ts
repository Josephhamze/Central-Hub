import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNumber, IsDecimal } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStockItemDto {
  @ApiPropertyOptional() @IsString() @IsOptional() companyId?: string;
  @ApiProperty() @IsString() projectId: string;
  @ApiProperty() @IsString() warehouseId: string;
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsString() @IsOptional() sku?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() description?: string;
  @ApiProperty() @IsString() uom: string;
  @ApiProperty() @Type(() => Number) @IsNumber() minUnitPrice: number;
  @ApiProperty() @Type(() => Number) @IsNumber() defaultUnitPrice: number;
  @ApiProperty() @Type(() => Number) @IsNumber() minOrderQty: number;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() truckloadOnly?: boolean;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() isActive?: boolean;
}
