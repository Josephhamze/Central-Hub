import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkOrderType, WorkOrderPriority } from '@prisma/client';

export class CreateWorkOrderDto {
  @ApiProperty({ description: 'Asset ID' })
  @IsString()
  @IsNotEmpty()
  assetId: string;

  @ApiPropertyOptional({ description: 'Schedule ID (for preventive maintenance)' })
  @IsString()
  @IsOptional()
  scheduleId?: string;

  @ApiProperty({ enum: WorkOrderType })
  @IsEnum(WorkOrderType)
  type: WorkOrderType;

  @ApiPropertyOptional({ enum: WorkOrderPriority, default: WorkOrderPriority.MEDIUM })
  @IsEnum(WorkOrderPriority)
  @IsOptional()
  priority?: WorkOrderPriority;

  @ApiProperty({ description: 'Work order description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: 'Assigned to user ID' })
  @IsString()
  @IsOptional()
  assignedToUserId?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
