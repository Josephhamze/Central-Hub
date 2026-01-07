import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRouteDto {
  @ApiProperty() @IsString() fromCity: string;
  @ApiProperty() @IsString() toCity: string;
  @ApiProperty() @Type(() => Number) @IsNumber() distanceKm: number;
  @ApiPropertyOptional() @Type(() => Number) @IsNumber() @IsOptional() timeHours?: number;
  @ApiPropertyOptional() @Type(() => Number) @IsNumber() @IsOptional() costPerKm?: number;
  @ApiPropertyOptional() @IsString() @IsOptional() warehouseId?: string;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() isActive?: boolean;
  @ApiPropertyOptional() @IsString() @IsOptional() notes?: string;
}
