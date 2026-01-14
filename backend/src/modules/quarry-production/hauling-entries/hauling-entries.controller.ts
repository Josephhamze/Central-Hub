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
import { HaulingEntriesService } from './hauling-entries.service';
import { CreateHaulingEntryDto } from './dto/create-hauling-entry.dto';
import { UpdateHaulingEntryDto } from './dto/update-hauling-entry.dto';
import { ApproveEntryDto } from '../excavator-entries/dto/approve-entry.dto';
import { RejectEntryDto } from '../excavator-entries/dto/reject-entry.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../../common/guards/rbac.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@Controller('quarry-production/hauling-entries')
@UseGuards(JwtAuthGuard, RbacGuard)
export class HaulingEntriesController {
  constructor(private readonly haulingEntriesService: HaulingEntriesService) {}

  @Post()
  @Permissions('quarry:hauling:create')
  create(
    @Body() createDto: CreateHaulingEntryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.haulingEntriesService.create(createDto, userId);
  }

  @Get()
  @Permissions('quarry:hauling-entries:view')
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('shift') shift?: string,
    @Query('truckId') truckId?: string,
    @Query('driverId') driverId?: string,
    @Query('status') status?: string,
  ) {
    return this.haulingEntriesService.findAll(
      page,
      limit,
      dateFrom,
      dateTo,
      shift as any,
      truckId,
      driverId,
      status as any,
    );
  }

  @Get(':id')
  @Permissions('quarry:hauling-entries:view')
  findOne(@Param('id') id: string) {
    return this.haulingEntriesService.findOne(id);
  }

  @Patch(':id')
  @Permissions('quarry:hauling-entries:update')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateHaulingEntryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.haulingEntriesService.update(id, updateDto, userId);
  }

  @Post(':id/approve')
  @Permissions('quarry:hauling-entries:approve')
  approve(
    @Param('id') id: string,
    @Body() approveDto: ApproveEntryDto,
    @CurrentUser('id') approverId: string,
  ) {
    return this.haulingEntriesService.approve(id, approverId, approveDto.notes);
  }

  @Post(':id/reject')
  @Permissions('quarry:hauling-entries:approve')
  reject(
    @Param('id') id: string,
    @Body() rejectDto: RejectEntryDto,
    @CurrentUser('id') approverId: string,
  ) {
    return this.haulingEntriesService.reject(id, approverId, rejectDto.reason);
  }

  @Delete(':id')
  @Permissions('quarry:hauling-entries:delete')
  remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.haulingEntriesService.remove(id, userId);
  }
}
