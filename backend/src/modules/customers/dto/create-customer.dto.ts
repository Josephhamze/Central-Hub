import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, IsEnum } from 'class-validator';
import { CustomerType } from '@prisma/client';

export class CreateCustomerDto {
  @ApiProperty({ enum: CustomerType })
  @IsEnum(CustomerType)
  type: CustomerType;

  @ApiPropertyOptional() @IsString() @IsOptional() firstName?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() lastName?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() companyName?: string;
  @ApiProperty() @IsString() billingAddressLine1: string;
  @ApiPropertyOptional() @IsString() @IsOptional() billingAddressLine2?: string;
  @ApiProperty() @IsString() billingCity: string;
  @ApiPropertyOptional() @IsString() @IsOptional() billingState?: string;
  @ApiProperty() @IsString() billingPostalCode: string;
  @ApiPropertyOptional() @IsString() @IsOptional() billingCountry?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() deliveryAddressLine1?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() deliveryAddressLine2?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() deliveryCity?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() deliveryState?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() deliveryPostalCode?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() deliveryCountry?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() phone?: string;
  @ApiPropertyOptional() @IsEmail() @IsOptional() email?: string;
}
