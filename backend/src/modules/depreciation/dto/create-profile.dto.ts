import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsInt,
  IsNumber,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DepreciationMethod } from '@prisma/client';

export class CreateDepreciationProfileDto {
  @ApiProperty({ description: 'Asset ID' })
  @IsString()
  @IsNotEmpty()
  assetId: string;

  @ApiProperty({ enum: DepreciationMethod })
  @IsEnum(DepreciationMethod)
  method: DepreciationMethod;

  @ApiProperty({ description: 'Useful life in years' })
  @IsInt()
  @Min(1)
  usefulLifeYears: number;

  @ApiProperty({ description: 'Salvage value' })
  @IsNumber()
  @Min(0)
  salvageValue: number;

  @ApiProperty({ description: 'Start date (ISO 8601)' })
  @IsDateString()
  startDate: string;
}
