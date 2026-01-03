import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { LossReasonCategory } from '@prisma/client';

export class QuoteOutcomeDto {
  @ApiPropertyOptional({ enum: LossReasonCategory, description: 'Required for LOST quotes' })
  @IsEnum(LossReasonCategory)
  @IsOptional()
  lossReasonCategory?: LossReasonCategory;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reasonNotes?: string;
}
