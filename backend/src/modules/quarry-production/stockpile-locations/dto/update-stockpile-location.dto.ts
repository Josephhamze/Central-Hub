import { PartialType } from '@nestjs/mapped-types';
import { CreateStockpileLocationDto } from './create-stockpile-location.dto';

export class UpdateStockpileLocationDto extends PartialType(CreateStockpileLocationDto) {}
