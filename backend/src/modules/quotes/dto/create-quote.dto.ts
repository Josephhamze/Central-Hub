import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsArray, ValidateNested, ValidateIf, IsInt, IsDateString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { DeliveryMethod, PaymentTerms, TruckType } from '@prisma/client';
import { CreateQuoteItemDto } from './create-quote-item.dto';

export class CreateQuoteDto {
  @ApiProperty() @IsString() companyId: string;
  @ApiProperty() @IsString() projectId: string;
  @ApiProperty() @IsString() customerId: string;
  @ApiPropertyOptional() @IsString() @IsOptional() contactId?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() warehouseId?: string;
  @ApiProperty({ enum: DeliveryMethod }) @IsEnum(DeliveryMethod) deliveryMethod: DeliveryMethod;
  @ApiPropertyOptional() @IsString() @IsOptional() routeId?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() deliveryAddressLine1?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() deliveryAddressLine2?: string;
  @ApiPropertyOptional() @IsString() @ValidateIf((o) => o.deliveryMethod === DeliveryMethod.DELIVERED) @IsOptional() deliveryCity?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() deliveryState?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() deliveryPostalCode?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() deliveryCountry?: string;
  // Validity
  @ApiPropertyOptional({ description: 'Quote validity in days (default: 7, admins can set more)', default: 7 })
  @IsInt() @Min(1) @IsOptional()
  validityDays?: number;
  // Payment Terms
  @ApiPropertyOptional({ enum: PaymentTerms }) @IsEnum(PaymentTerms) @IsOptional() paymentTerms?: PaymentTerms;
  // Delivery Terms
  @ApiPropertyOptional({ description: 'Delivery start date (ISO 8601)' }) @IsDateString() @IsOptional() deliveryStartDate?: string;
  @ApiPropertyOptional({ description: 'Number of loads per day (max 5)', maximum: 5 }) @IsInt() @Min(1) @Max(5) @IsOptional() loadsPerDay?: number;
  @ApiPropertyOptional({ enum: TruckType }) @IsEnum(TruckType) @IsOptional() truckType?: TruckType;
  @ApiProperty({ type: [CreateQuoteItemDto] }) @IsArray() @ValidateNested({ each: true }) @Type(() => CreateQuoteItemDto) items: CreateQuoteItemDto[];
}
