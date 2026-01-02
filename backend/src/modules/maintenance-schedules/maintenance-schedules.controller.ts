import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { MaintenanceSchedulesService } from './maintenance-schedules.service';
import { CreateMaintenanceScheduleDto } from './dto/create-maintenance-schedule.dto';
import { UpdateMaintenanceScheduleDto } from './dto/update-maintenance-schedule.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';

@ApiTags('Maintenance Schedules')
@ApiBearerAuth('JWT-auth')
@Controller('maintenance-schedules')
@UseInterceptors(ResponseInterceptor)
@UseGuards(RbacGuard)
export class MaintenanceSchedulesController {
  constructor(private readonly maintenanceSchedulesService: MaintenanceSchedulesService) {}

  @Get()
  @Permissions('maintenance:view')
  @ApiOperation({ summary: 'Get all maintenance schedules' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'assetId', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'List of maintenance schedules' })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('assetId') assetId?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.maintenanceSchedulesService.findAll(page, limit, assetId, isActive);
  }

  @Get('overdue')
  @Permissions('maintenance:view')
  @ApiOperation({ summary: 'Get overdue maintenance schedules' })
  @ApiResponse({ status: 200, description: 'List of overdue schedules' })
  async getOverdue() {
    return this.maintenanceSchedulesService.getOverdue();
  }

  @Get(':id')
  @Permissions('maintenance:view')
  @ApiOperation({ summary: 'Get maintenance schedule by ID' })
  @ApiResponse({ status: 200, description: 'Maintenance schedule details' })
  @ApiResponse({ status: 404, description: 'Schedule not found' })
  async findOne(@Param('id') id: string) {
    return this.maintenanceSchedulesService.findOne(id);
  }

  @Post()
  @Permissions('maintenance:schedule')
  @ApiOperation({ summary: 'Create a new maintenance schedule' })
  @ApiResponse({ status: 201, description: 'Schedule created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(@Body() dto: CreateMaintenanceScheduleDto) {
    return this.maintenanceSchedulesService.create(dto);
  }

  @Put(':id')
  @Permissions('maintenance:schedule')
  @ApiOperation({ summary: 'Update a maintenance schedule' })
  @ApiResponse({ status: 200, description: 'Schedule updated successfully' })
  @ApiResponse({ status: 404, description: 'Schedule not found' })
  async update(@Param('id') id: string, @Body() dto: UpdateMaintenanceScheduleDto) {
    return this.maintenanceSchedulesService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('maintenance:schedule')
  @ApiOperation({ summary: 'Delete a maintenance schedule' })
  @ApiResponse({ status: 200, description: 'Schedule deleted successfully' })
  @ApiResponse({ status: 404, description: 'Schedule not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete schedule with work orders' })
  async remove(@Param('id') id: string) {
    return this.maintenanceSchedulesService.remove(id);
  }
}
