import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class QuoteOutcomeDto {
  @ApiProperty() @IsString() reasonCategory: string;
  @ApiPropertyOptional() @IsString() @IsOptional() reasonNotes?: string;
}
