import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsObject, IsOptional, IsBoolean, ValidateNested } from 'class-validator';
import { VehicleType } from '@prisma/client';
import { Type } from 'class-transformer';

// Cost profile config schema
export class CostProfileConfigDto {
  @ApiPropertyOptional({ description: 'Fuel cost per unit (e.g., per liter)' })
  fuel?: { costPerUnit?: number; consumptionPerKm?: number; costPerKm?: number };

  @ApiPropertyOptional({ description: 'Monthly communications cost (e.g., MTN)' })
  communicationsMonthly?: number;

  @ApiPropertyOptional({ description: 'Monthly labor cost (e.g., HR per month)' })
  laborMonthly?: number;

  @ApiPropertyOptional({ description: 'Monthly documents and GPS cost' })
  docsGpsMonthly?: number;

  @ApiPropertyOptional({ description: 'Monthly depreciation cost (DP per month)' })
  depreciationMonthly?: number;

  @ApiPropertyOptional({ description: 'Overhead cost per trip' })
  overheadPerTrip?: number;

  @ApiPropertyOptional({ description: 'Include empty return leg in calculations', default: false })
  includeEmptyLeg?: boolean;

  @ApiPropertyOptional({ description: 'Empty leg factor (multiplier for return distance)', default: 1.0 })
  emptyLegFactor?: number;

  @ApiPropertyOptional({ description: 'Default profit margin percentage', default: 0 })
  profitMarginPercent?: number;
}

export class CreateCostProfileDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty({ enum: VehicleType }) @IsEnum(VehicleType) vehicleType: VehicleType;
  @ApiPropertyOptional() @IsString() @IsOptional() currency?: string;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() isActive?: boolean;
  @ApiProperty({ type: CostProfileConfigDto })
  @IsObject()
  @ValidateNested()
  @Type(() => CostProfileConfigDto)
  config: CostProfileConfigDto;
}
