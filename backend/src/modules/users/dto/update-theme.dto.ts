import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ThemeOption {
  LIGHT = 'LIGHT',
  DARK = 'DARK',
  SYSTEM = 'SYSTEM',
}

export class UpdateThemeDto {
  @ApiProperty({
    description: 'Theme preference',
    enum: ThemeOption,
    example: ThemeOption.SYSTEM,
  })
  @IsEnum(ThemeOption)
  @IsNotEmpty()
  theme: ThemeOption;
}
