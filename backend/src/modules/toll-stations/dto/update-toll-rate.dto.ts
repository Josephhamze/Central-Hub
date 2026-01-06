import { PartialType } from '@nestjs/swagger';
import { CreateTollRateDto } from './create-toll-rate.dto';
export class UpdateTollRateDto extends PartialType(CreateTollRateDto) {}
