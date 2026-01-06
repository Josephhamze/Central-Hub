import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional, IsDateString, IsBoolean } from 'class-validator';
import { VehicleType } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateTollRateDto {
  @ApiProperty({ enum: VehicleType }) @IsEnum(VehicleType) vehicleType: VehicleType;
  @ApiProperty() @Type(() => Number) @IsNumber() amount: number;
  @ApiPropertyOptional() @IsString() @IsOptional() currency?: string;
  @ApiPropertyOptional() @IsDateString() @IsOptional() effectiveFrom?: string;
  @ApiPropertyOptional() @IsDateString() @IsOptional() effectiveTo?: string;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() isActive?: boolean;
}
