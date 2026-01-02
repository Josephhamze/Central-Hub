import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTollDto {
  @ApiProperty() @IsString() routeId: string;
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @Type(() => Number) @IsNumber() cost: number;
}
