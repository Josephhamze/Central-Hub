import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { StockpileLocationsService } from './stockpile-locations.service';
import { CreateStockpileLocationDto } from './dto/create-stockpile-location.dto';
import { UpdateStockpileLocationDto } from './dto/update-stockpile-location.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../../common/guards/rbac.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';

@Controller('quarry-production/stockpile-locations')
@UseGuards(JwtAuthGuard, RbacGuard)
export class StockpileLocationsController {
  constructor(private readonly stockpileLocationsService: StockpileLocationsService) {}

  @Post()
  @Permissions('quarry:settings:manage')
  create(@Body() createDto: CreateStockpileLocationDto) {
    return this.stockpileLocationsService.create(createDto);
  }

  @Get()
  @Permissions('quarry:settings:view')
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
  ) {
    const isActiveBool = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.stockpileLocationsService.findAll(page, limit, search, isActiveBool);
  }

  @Get(':id')
  @Permissions('quarry:settings:view')
  findOne(@Param('id') id: string) {
    return this.stockpileLocationsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('quarry:settings:manage')
  update(@Param('id') id: string, @Body() updateDto: UpdateStockpileLocationDto) {
    return this.stockpileLocationsService.update(id, updateDto);
  }

  @Delete(':id')
  @Permissions('quarry:settings:manage')
  remove(@Param('id') id: string) {
    return this.stockpileLocationsService.remove(id);
  }
}
