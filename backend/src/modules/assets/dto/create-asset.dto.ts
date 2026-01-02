import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssetStatus, AssetCriticality } from '@prisma/client';

export class CreateAssetDto {
  @ApiProperty({ description: 'Unique asset tag/identifier' })
  @IsString()
  @IsNotEmpty()
  assetTag: string;

  @ApiProperty({ description: 'Asset name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Asset category (e.g., Crusher, Truck, Generator)' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiPropertyOptional({ description: 'Manufacturer name' })
  @IsString()
  @IsOptional()
  manufacturer?: string;

  @ApiPropertyOptional({ description: 'Model number' })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiPropertyOptional({ description: 'Serial number' })
  @IsString()
  @IsOptional()
  serialNumber?: string;

  @ApiProperty({ description: 'Acquisition date (ISO 8601)' })
  @IsDateString()
  acquisitionDate: string;

  @ApiProperty({ description: 'Acquisition cost' })
  @IsNumber()
  @Min(0)
  acquisitionCost: number;

  @ApiProperty({ description: 'Current value' })
  @IsNumber()
  @Min(0)
  currentValue: number;

  @ApiPropertyOptional({ enum: AssetStatus, default: AssetStatus.OPERATIONAL })
  @IsEnum(AssetStatus)
  @IsOptional()
  status?: AssetStatus;

  @ApiPropertyOptional({ description: 'Location description' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ description: 'Project ID' })
  @IsString()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional({ description: 'Warehouse ID' })
  @IsString()
  @IsOptional()
  warehouseId?: string;

  @ApiPropertyOptional({ description: 'Assigned to (operator or department)' })
  @IsString()
  @IsOptional()
  assignedTo?: string;

  @ApiPropertyOptional({ enum: AssetCriticality, default: AssetCriticality.MEDIUM })
  @IsEnum(AssetCriticality)
  @IsOptional()
  criticality?: AssetCriticality;

  @ApiPropertyOptional({ description: 'Expected life in years' })
  @IsInt()
  @Min(1)
  @IsOptional()
  expectedLifeYears?: number;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
