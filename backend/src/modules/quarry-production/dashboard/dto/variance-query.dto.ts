import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { Shift } from '@prisma/client';

export class VarianceQueryDto {
  @IsDateString()
  date: string;

  @IsEnum(Shift)
  @IsOptional()
  shift?: Shift;
}
