import { PartialType } from '@nestjs/mapped-types';
import { CreateHaulingEntryDto } from './create-hauling-entry.dto';

export class UpdateHaulingEntryDto extends PartialType(CreateHaulingEntryDto) {}
