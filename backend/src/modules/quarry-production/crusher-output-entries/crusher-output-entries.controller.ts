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
import { CrusherOutputEntriesService } from './crusher-output-entries.service';
import { CreateCrusherOutputEntryDto } from './dto/create-crusher-output-entry.dto';
import { UpdateCrusherOutputEntryDto } from './dto/update-crusher-output-entry.dto';
import { ApproveEntryDto } from '../excavator-entries/dto/approve-entry.dto';
import { RejectEntryDto } from '../excavator-entries/dto/reject-entry.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../../common/guards/rbac.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@Controller('api/v1/quarry-production/crusher-output-entries')
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrusherOutputEntriesController {
  constructor(private readonly crusherOutputEntriesService: CrusherOutputEntriesService) {}

  @Post()
  @Permissions('quarry:crusher-output:create')
  create(
    @Body() createDto: CreateCrusherOutputEntryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.crusherOutputEntriesService.create(createDto, userId);
  }

  @Get()
  @Permissions('quarry:crusher-output:view')
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('shift') shift?: string,
    @Query('crusherId') crusherId?: string,
    @Query('productTypeId') productTypeId?: string,
    @Query('status') status?: string,
  ) {
    return this.crusherOutputEntriesService.findAll(
      page,
      limit,
      dateFrom,
      dateTo,
      shift as any,
      crusherId,
      productTypeId,
      status as any,
    );
  }

  @Get(':id')
  @Permissions('quarry:crusher-output:view')
  findOne(@Param('id') id: string) {
    return this.crusherOutputEntriesService.findOne(id);
  }

  @Patch(':id')
  @Permissions('quarry:crusher-output:update')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCrusherOutputEntryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.crusherOutputEntriesService.update(id, updateDto, userId);
  }

  @Post(':id/approve')
  @Permissions('quarry:crusher-output:approve')
  approve(
    @Param('id') id: string,
    @Body() approveDto: ApproveEntryDto,
    @CurrentUser('id') approverId: string,
  ) {
    return this.crusherOutputEntriesService.approve(id, approverId, approveDto.notes);
  }

  @Post(':id/reject')
  @Permissions('quarry:crusher-output:approve')
  reject(
    @Param('id') id: string,
    @Body() rejectDto: RejectEntryDto,
    @CurrentUser('id') approverId: string,
  ) {
    return this.crusherOutputEntriesService.reject(id, approverId, rejectDto.reason);
  }

  @Delete(':id')
  @Permissions('quarry:crusher-output:delete')
  remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.crusherOutputEntriesService.remove(id, userId);
  }
}
