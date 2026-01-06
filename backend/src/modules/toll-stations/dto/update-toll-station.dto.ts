import { PartialType } from '@nestjs/swagger';
import { CreateTollStationDto } from './create-toll-station.dto';
export class UpdateTollStationDto extends PartialType(CreateTollStationDto) {}
