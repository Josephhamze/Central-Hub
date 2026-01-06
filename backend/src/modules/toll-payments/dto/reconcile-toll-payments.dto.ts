import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsDateString, IsOptional } from 'class-validator';
import { VehicleType } from '@prisma/client';

export class ReconcileTollPaymentsDto {
  @ApiProperty() @IsDateString() startDate: string;
  @ApiProperty() @IsDateString() endDate: string;
  @ApiPropertyOptional() @IsString() @IsOptional() routeId?: string;
  @ApiPropertyOptional({ enum: VehicleType }) @IsEnum(VehicleType) @IsOptional() vehicleType?: VehicleType;
}
