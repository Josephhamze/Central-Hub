import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRouteRequestDto {
  @ApiProperty() @IsString() fromCity: string;
  @ApiProperty() @IsString() toCity: string;
  @ApiProperty() @Type(() => Number) @IsNumber() distanceKm: number;
  @ApiPropertyOptional() @Type(() => Number) @IsNumber() @IsOptional() timeHours?: number;
  @ApiPropertyOptional() @IsString() @IsOptional() warehouseId?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() notes?: string;
}
