import { PartialType } from '@nestjs/mapped-types';
import { CreateStockLevelDto } from './create-stock-level.dto';

export class UpdateStockLevelDto extends PartialType(CreateStockLevelDto) {}
