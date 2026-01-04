import { IsOptional, IsInt, Min, Max, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInviteCodeDto {
  @ApiPropertyOptional({
    description: 'Number of times this code can be used',
    example: 1,
    default: 1,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  maxUses?: number;

  @ApiPropertyOptional({
    description: 'Expiration date (ISO string)',
    example: '2026-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
