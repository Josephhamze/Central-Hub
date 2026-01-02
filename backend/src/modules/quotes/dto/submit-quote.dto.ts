import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class SubmitQuoteDto {
  @ApiPropertyOptional() @IsString() @IsOptional() notes?: string;
}
