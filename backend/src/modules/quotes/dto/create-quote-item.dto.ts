import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateQuoteItemDto {
  @ApiProperty() @IsString() stockItemId: string;
  @ApiProperty() @Type(() => Number) @IsNumber() qty: number;
  @ApiProperty() @Type(() => Number) @IsNumber() unitPrice: number;
  @ApiPropertyOptional({ description: 'Discount percentage (0-100)', default: 0 })
  @Type(() => Number) @IsNumber() @Min(0) @Max(100) @IsOptional()
  discountPercentage?: number;
}
