import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConsumePartDto {
  @ApiProperty({ description: 'Spare part ID' })
  @IsString()
  @IsNotEmpty()
  sparePartId: string;

  @ApiProperty({ description: 'Quantity to consume' })
  @IsNumber()
  @Min(0.01)
  quantityUsed: number;
}
