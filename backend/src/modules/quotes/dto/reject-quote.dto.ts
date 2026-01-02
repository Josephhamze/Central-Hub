import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RejectQuoteDto {
  @ApiProperty() @IsString() reason: string;
}
