import { PartialType } from '@nestjs/mapped-types';
import { CreateExcavatorEntryDto } from './create-excavator-entry.dto';

export class UpdateExcavatorEntryDto extends PartialType(CreateExcavatorEntryDto) {}
