import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
  IsBoolean,
  IsObject,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MaintenanceScheduleType } from '@prisma/client';

export class CreateMaintenanceScheduleDto {
  @ApiProperty({ description: 'Asset ID' })
  @IsString()
  @IsNotEmpty()
  assetId: string;

  @ApiProperty({ enum: MaintenanceScheduleType })
  @IsEnum(MaintenanceScheduleType)
  type: MaintenanceScheduleType;

  @ApiPropertyOptional({ description: 'Interval in days (for time-based)' })
  @IsInt()
  @Min(1)
  @IsOptional()
  intervalDays?: number;

  @ApiPropertyOptional({ description: 'Interval in hours (for usage-based)' })
  @IsInt()
  @Min(1)
  @IsOptional()
  intervalHours?: number;

  @ApiPropertyOptional({ description: 'Checklist as JSON' })
  @IsObject()
  @IsOptional()
  checklistJson?: any;

  @ApiPropertyOptional({ description: 'Estimated duration in hours' })
  @IsOptional()
  estimatedDurationHours?: number;

  @ApiPropertyOptional({ description: 'Required parts as JSON' })
  @IsObject()
  @IsOptional()
  requiredPartsJson?: any;

  @ApiPropertyOptional({ description: 'Is active', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
