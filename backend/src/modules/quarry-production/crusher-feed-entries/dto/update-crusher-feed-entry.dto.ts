import { PartialType } from '@nestjs/mapped-types';
import { CreateCrusherFeedEntryDto } from './create-crusher-feed-entry.dto';

export class UpdateCrusherFeedEntryDto extends PartialType(CreateCrusherFeedEntryDto) {}
