import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { RouteRequestStatus } from '@prisma/client';

export class ReviewRouteRequestDto {
  @ApiProperty({ enum: RouteRequestStatus }) @IsEnum(RouteRequestStatus) status: RouteRequestStatus;
  @ApiPropertyOptional() @IsString() @IsOptional() rejectionReason?: string | null;
}
