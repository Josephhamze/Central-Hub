import { PartialType } from '@nestjs/mapped-types';
import { CreateExcavatorDto } from './create-excavator.dto';

export class UpdateExcavatorDto extends PartialType(CreateExcavatorDto) {}
