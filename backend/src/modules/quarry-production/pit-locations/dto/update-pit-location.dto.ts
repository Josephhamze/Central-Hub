import { PartialType } from '@nestjs/mapped-types';
import { CreatePitLocationDto } from './create-pit-location.dto';

export class UpdatePitLocationDto extends PartialType(CreatePitLocationDto) {}
