import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsArray, ValidateNested, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
import { DeliveryMethod } from '@prisma/client';
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
  @ApiProperty({ type: [CreateQuoteItemDto] }) @IsArray() @ValidateNested({ each: true }) @Type(() => CreateQuoteItemDto) items: CreateQuoteItemDto[];
}
