import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber, IsDateString, IsOptional } from 'class-validator';
import { VehicleType, TollPaymentStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateTollPaymentDto {
  @ApiProperty() @IsDateString() paidAt: string;
  @ApiProperty({ enum: VehicleType }) @IsEnum(VehicleType) vehicleType: VehicleType;
  @ApiPropertyOptional() @IsString() @IsOptional() routeId?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() tollStationId?: string;
  @ApiProperty() @Type(() => Number) @IsNumber() amount: number;
  @ApiPropertyOptional() @IsString() @IsOptional() currency?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() receiptRef?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() notes?: string;
  @ApiPropertyOptional({ enum: TollPaymentStatus }) @IsEnum(TollPaymentStatus) @IsOptional() status?: TollPaymentStatus;
}
