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
import { ExcavatorEntriesService } from './excavator-entries.service';
import { CreateExcavatorEntryDto } from './dto/create-excavator-entry.dto';
import { UpdateExcavatorEntryDto } from './dto/update-excavator-entry.dto';
import { ApproveEntryDto } from './dto/approve-entry.dto';
import { RejectEntryDto } from './dto/reject-entry.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../../common/guards/rbac.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@Controller('api/v1/quarry-production/excavator-entries')
@UseGuards(JwtAuthGuard, RbacGuard)
export class ExcavatorEntriesController {
  constructor(private readonly excavatorEntriesService: ExcavatorEntriesService) {}

  @Post()
  @Permissions('quarry:excavator:create')
  create(
    @Body() createDto: CreateExcavatorEntryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.excavatorEntriesService.create(createDto, userId);
  }

  @Get()
  @Permissions('quarry:excavator:view')
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('shift') shift?: string,
    @Query('excavatorId') excavatorId?: string,
    @Query('operatorId') operatorId?: string,
    @Query('status') status?: string,
  ) {
    return this.excavatorEntriesService.findAll(
      page,
      limit,
      dateFrom,
      dateTo,
      shift as any,
      excavatorId,
      operatorId,
      status as any,
    );
  }

  @Get(':id')
  @Permissions('quarry:excavator:view')
  findOne(@Param('id') id: string) {
    return this.excavatorEntriesService.findOne(id);
  }

  @Patch(':id')
  @Permissions('quarry:excavator:update')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateExcavatorEntryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.excavatorEntriesService.update(id, updateDto, userId);
  }

  @Post(':id/approve')
  @Permissions('quarry:excavator:approve')
  approve(
    @Param('id') id: string,
    @Body() approveDto: ApproveEntryDto,
    @CurrentUser('id') approverId: string,
  ) {
    return this.excavatorEntriesService.approve(id, approverId, approveDto.notes);
  }

  @Post(':id/reject')
  @Permissions('quarry:excavator:approve')
  reject(
    @Param('id') id: string,
    @Body() rejectDto: RejectEntryDto,
    @CurrentUser('id') approverId: string,
  ) {
    return this.excavatorEntriesService.reject(id, approverId, rejectDto.reason);
  }

  @Delete(':id')
  @Permissions('quarry:excavator:delete')
  remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.excavatorEntriesService.remove(id, userId);
  }
}
