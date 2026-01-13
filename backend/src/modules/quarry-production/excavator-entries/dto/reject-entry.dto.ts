import { IsString, IsNotEmpty } from 'class-validator';

export class RejectEntryDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}
