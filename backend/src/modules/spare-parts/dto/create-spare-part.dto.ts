import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSparePartDto {
  @ApiProperty({ description: 'Part name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'SKU (unique identifier)' })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty({ description: 'Unit of measure' })
  @IsString()
  @IsNotEmpty()
  uom: string;

  @ApiProperty({ description: 'Warehouse ID' })
  @IsString()
  @IsNotEmpty()
  warehouseId: string;

  @ApiPropertyOptional({ description: 'Quantity on hand', default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  quantityOnHand?: number;

  @ApiPropertyOptional({ description: 'Minimum stock level', default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minStockLevel?: number;

  @ApiProperty({ description: 'Unit cost' })
  @IsNumber()
  @Min(0)
  unitCost: number;

  @ApiPropertyOptional({ description: 'Is critical part', default: false })
  @IsBoolean()
  @IsOptional()
  isCritical?: boolean;
}
