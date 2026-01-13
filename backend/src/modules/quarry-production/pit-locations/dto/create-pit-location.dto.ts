import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreatePitLocationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
