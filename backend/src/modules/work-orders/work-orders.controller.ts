import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
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
import { WorkOrdersService } from './work-orders.service';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';
import { CompleteWorkOrderDto } from './dto/complete-work-order.dto';
import { ConsumePartDto } from './dto/consume-part.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';
import { WorkOrderStatus } from '@prisma/client';

@ApiTags('Work Orders')
@ApiBearerAuth('JWT-auth')
@Controller('work-orders')
@UseInterceptors(ResponseInterceptor)
@UseGuards(RbacGuard)
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @Get()
  @Permissions('workorders:view')
  @ApiOperation({ summary: 'Get all work orders' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: WorkOrderStatus })
  @ApiQuery({ name: 'assetId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of work orders' })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: WorkOrderStatus,
    @Query('assetId') assetId?: string,
  ) {
    return this.workOrdersService.findAll(page, limit, status, assetId);
  }

  @Get(':id')
  @Permissions('workorders:view')
  @ApiOperation({ summary: 'Get work order by ID' })
  @ApiResponse({ status: 200, description: 'Work order details' })
  @ApiResponse({ status: 404, description: 'Work order not found' })
  async findOne(@Param('id') id: string) {
    return this.workOrdersService.findOne(id);
  }

  @Post()
  @Permissions('workorders:create')
  @ApiOperation({ summary: 'Create a new work order' })
  @ApiResponse({ status: 201, description: 'Work order created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(
    @Body() dto: CreateWorkOrderDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.workOrdersService.create(dto, userId);
  }

  @Put(':id')
  @Permissions('workorders:update')
  @ApiOperation({ summary: 'Update a work order' })
  @ApiResponse({ status: 200, description: 'Work order updated successfully' })
  @ApiResponse({ status: 404, description: 'Work order not found' })
  async update(@Param('id') id: string, @Body() dto: UpdateWorkOrderDto) {
    return this.workOrdersService.update(id, dto);
  }

  @Patch(':id/start')
  @Permissions('workorders:update')
  @ApiOperation({ summary: 'Start a work order' })
  @ApiResponse({ status: 200, description: 'Work order started' })
  async start(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.workOrdersService.start(id, userId);
  }

  @Patch(':id/complete')
  @Permissions('workorders:close')
  @ApiOperation({ summary: 'Complete a work order' })
  @ApiResponse({ status: 200, description: 'Work order completed' })
  async complete(
    @Param('id') id: string,
    @Body() dto: CompleteWorkOrderDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.workOrdersService.complete(id, dto, userId);
  }

  @Patch(':id/cancel')
  @Permissions('workorders:update')
  @ApiOperation({ summary: 'Cancel a work order' })
  @ApiResponse({ status: 200, description: 'Work order cancelled' })
  async cancel(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.workOrdersService.cancel(id, userId);
  }

  @Post(':id/consume-part')
  @Permissions('workorders:update')
  @ApiOperation({ summary: 'Consume a spare part for a work order' })
  @ApiResponse({ status: 200, description: 'Part consumed successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient stock' })
  async consumePart(
    @Param('id') workOrderId: string,
    @Body() dto: ConsumePartDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.workOrdersService.consumePart(workOrderId, dto, userId);
  }
}
