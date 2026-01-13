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
import { CrusherFeedEntriesService } from './crusher-feed-entries.service';
import { CreateCrusherFeedEntryDto } from './dto/create-crusher-feed-entry.dto';
import { UpdateCrusherFeedEntryDto } from './dto/update-crusher-feed-entry.dto';
import { ApproveEntryDto } from '../excavator-entries/dto/approve-entry.dto';
import { RejectEntryDto } from '../excavator-entries/dto/reject-entry.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../../common/guards/rbac.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@Controller('quarry-production/crusher-feed-entries')
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrusherFeedEntriesController {
  constructor(private readonly crusherFeedEntriesService: CrusherFeedEntriesService) {}

  @Post()
  @Permissions('quarry:crusher-feed:create')
  create(
    @Body() createDto: CreateCrusherFeedEntryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.crusherFeedEntriesService.create(createDto, userId);
  }

  @Get()
  @Permissions('quarry:crusher-feed:view')
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('shift') shift?: string,
    @Query('crusherId') crusherId?: string,
    @Query('status') status?: string,
  ) {
    return this.crusherFeedEntriesService.findAll(
      page,
      limit,
      dateFrom,
      dateTo,
      shift as any,
      crusherId,
      status as any,
    );
  }

  @Get(':id')
  @Permissions('quarry:crusher-feed:view')
  findOne(@Param('id') id: string) {
    return this.crusherFeedEntriesService.findOne(id);
  }

  @Patch(':id')
  @Permissions('quarry:crusher-feed:update')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCrusherFeedEntryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.crusherFeedEntriesService.update(id, updateDto, userId);
  }

  @Post(':id/approve')
  @Permissions('quarry:crusher-feed:approve')
  approve(
    @Param('id') id: string,
    @Body() approveDto: ApproveEntryDto,
    @CurrentUser('id') approverId: string,
  ) {
    return this.crusherFeedEntriesService.approve(id, approverId, approveDto.notes);
  }

  @Post(':id/reject')
  @Permissions('quarry:crusher-feed:approve')
  reject(
    @Param('id') id: string,
    @Body() rejectDto: RejectEntryDto,
    @CurrentUser('id') approverId: string,
  ) {
    return this.crusherFeedEntriesService.reject(id, approverId, rejectDto.reason);
  }

  @Delete(':id')
  @Permissions('quarry:crusher-feed:delete')
  remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.crusherFeedEntriesService.remove(id, userId);
  }
}
