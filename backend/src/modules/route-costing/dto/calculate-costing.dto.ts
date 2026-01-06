import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { VehicleType } from '@prisma/client';
import { Type } from 'class-transformer';

export class CalculateCostingDto {
  @ApiProperty() @IsString() routeId: string;
  @ApiProperty({ enum: VehicleType }) @IsEnum(VehicleType) vehicleType: VehicleType;
  @ApiProperty() @IsString() costProfileId: string;
  @ApiProperty() @Type(() => Number) @IsNumber() tonsPerTrip: number;
  @ApiPropertyOptional() @Type(() => Number) @IsNumber() @IsOptional() tripsPerMonth?: number;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() includeEmptyLeg?: boolean;
  @ApiPropertyOptional() @Type(() => Number) @IsNumber() @IsOptional() profitMarginPercentOverride?: number;
}
