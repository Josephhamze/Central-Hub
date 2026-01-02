import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRouteDto {
  @ApiProperty() @IsString() fromCity: string;
  @ApiProperty() @IsString() toCity: string;
  @ApiProperty() @Type(() => Number) @IsNumber() distanceKm: number;
  @ApiProperty() @Type(() => Number) @IsNumber() costPerKm: number;
}
