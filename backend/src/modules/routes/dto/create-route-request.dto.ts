import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRouteRequestDto {
  @ApiPropertyOptional() @IsString() @IsOptional() fromCity?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() toCity?: string;
  @ApiPropertyOptional() @Type(() => Number) @IsNumber() @IsOptional() distanceKm?: number;
  @ApiPropertyOptional() @Type(() => Number) @IsNumber() @IsOptional() timeHours?: number;
  @ApiPropertyOptional() @IsString() @IsOptional() warehouseId?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() notes?: string;
}
