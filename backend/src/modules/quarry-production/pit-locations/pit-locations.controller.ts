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
import { PitLocationsService } from './pit-locations.service';
import { CreatePitLocationDto } from './dto/create-pit-location.dto';
import { UpdatePitLocationDto } from './dto/update-pit-location.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../../common/guards/rbac.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';

@Controller('api/v1/quarry-production/pit-locations')
@UseGuards(JwtAuthGuard, RbacGuard)
export class PitLocationsController {
  constructor(private readonly pitLocationsService: PitLocationsService) {}

  @Post()
  @Permissions('quarry:settings:manage')
  create(@Body() createDto: CreatePitLocationDto) {
    return this.pitLocationsService.create(createDto);
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
    return this.pitLocationsService.findAll(page, limit, search, isActiveBool);
  }

  @Get(':id')
  @Permissions('quarry:settings:view')
  findOne(@Param('id') id: string) {
    return this.pitLocationsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('quarry:settings:manage')
  update(@Param('id') id: string, @Body() updateDto: UpdatePitLocationDto) {
    return this.pitLocationsService.update(id, updateDto);
  }

  @Delete(':id')
  @Permissions('quarry:settings:manage')
  remove(@Param('id') id: string) {
    return this.pitLocationsService.remove(id);
  }
}
