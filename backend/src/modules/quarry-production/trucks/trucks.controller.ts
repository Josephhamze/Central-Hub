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
import { TrucksService } from './trucks.service';
import { CreateTruckDto } from './dto/create-truck.dto';
import { UpdateTruckDto } from './dto/update-truck.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../../common/guards/rbac.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';

@Controller('quarry-production/trucks')
@UseGuards(JwtAuthGuard, RbacGuard)
export class TrucksController {
  constructor(private readonly trucksService: TrucksService) {}

  @Post()
  @Permissions('quarry:equipment:manage')
  create(@Body() createTruckDto: CreateTruckDto) {
    return this.trucksService.create(createTruckDto);
  }

  @Get()
  @Permissions('quarry:equipment:view')
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.trucksService.findAll(page, limit, search, status as any);
  }

  @Get(':id')
  @Permissions('quarry:equipment:view')
  findOne(@Param('id') id: string) {
    return this.trucksService.findOne(id);
  }

  @Patch(':id')
  @Permissions('quarry:equipment:manage')
  update(@Param('id') id: string, @Body() updateTruckDto: UpdateTruckDto) {
    return this.trucksService.update(id, updateTruckDto);
  }

  @Delete(':id')
  @Permissions('quarry:equipment:manage')
  remove(@Param('id') id: string) {
    return this.trucksService.remove(id);
  }
}
