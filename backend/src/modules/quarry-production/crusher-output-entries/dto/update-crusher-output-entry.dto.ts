import { PartialType } from '@nestjs/mapped-types';
import { CreateCrusherOutputEntryDto } from './create-crusher-output-entry.dto';

export class UpdateCrusherOutputEntryDto extends PartialType(CreateCrusherOutputEntryDto) {}
