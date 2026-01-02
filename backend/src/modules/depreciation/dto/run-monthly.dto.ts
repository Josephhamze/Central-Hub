import {
  IsString,
  IsNotEmpty,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RunMonthlyDepreciationDto {
  @ApiProperty({ description: 'Period in YYYY-MM format', example: '2026-01' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}$/, { message: 'Period must be in YYYY-MM format' })
  period: string;
}
