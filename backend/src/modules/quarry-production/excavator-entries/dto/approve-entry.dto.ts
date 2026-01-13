import { IsString, IsOptional } from 'class-validator';

export class ApproveEntryDto {
  @IsString()
  @IsOptional()
  notes?: string;
}
