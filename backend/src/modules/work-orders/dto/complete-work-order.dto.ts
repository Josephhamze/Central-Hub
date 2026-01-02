import {
  IsOptional,
  IsNumber,
  IsString,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CompleteWorkOrderDto {
  @ApiPropertyOptional({ description: 'Downtime in hours' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  downtimeHours?: number;

  @ApiPropertyOptional({ description: 'Labor cost' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  laborCost?: number;

  @ApiPropertyOptional({ description: 'Completion notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
