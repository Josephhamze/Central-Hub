import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdatePitLocationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
