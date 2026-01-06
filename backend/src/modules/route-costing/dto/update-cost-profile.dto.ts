import { PartialType } from '@nestjs/swagger';
import { CreateCostProfileDto } from './create-cost-profile.dto';
export class UpdateCostProfileDto extends PartialType(CreateCostProfileDto) {}
