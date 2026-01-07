import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsNumber, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

class RouteStationItem {
  @ApiProperty() @IsString() tollStationId: string;
  @ApiProperty() @Type(() => Number) @IsNumber() @Min(1) sortOrder: number;
}

export class SetRouteStationsDto {
  @ApiProperty({ type: [RouteStationItem] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RouteStationItem)
  stations: RouteStationItem[];
}
