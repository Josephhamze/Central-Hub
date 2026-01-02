import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateQuoteItemDto {
  @ApiProperty() @IsString() stockItemId: string;
  @ApiProperty() @Type(() => Number) @IsNumber() qty: number;
  @ApiProperty() @Type(() => Number) @IsNumber() unitPrice: number;
  @ApiProperty() @Type(() => Number) @IsNumber() discount: number;
}
