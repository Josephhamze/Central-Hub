import { PartialType } from '@nestjs/mapped-types';
import { CreateCrusherDto } from './create-crusher.dto';

export class UpdateCrusherDto extends PartialType(CreateCrusherDto) {}
