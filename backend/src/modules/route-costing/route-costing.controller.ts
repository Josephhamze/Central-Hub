import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RouteCostingService } from './route-costing.service';
import { CreateCostProfileDto } from './dto/create-cost-profile.dto';
import { UpdateCostProfileDto } from './dto/update-cost-profile.dto';
import { CalculateCostingDto } from './dto/calculate-costing.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { VehicleType } from '@prisma/client';

@ApiTags('Route Costing')
@ApiBearerAuth('JWT-auth')
@Controller('cost-profiles')
@UseInterceptors(ResponseInterceptor)
export class RouteCostingController {
  constructor(private readonly routeCostingService: RouteCostingService) {}

  @Get()
  @UseGuards(RbacGuard)
  @Permissions('logistics:costing:view')
  @ApiOperation({ summary: 'Get all cost profiles' })
  @ApiQuery({ name: 'vehicleType', enum: VehicleType, required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @Query('vehicleType') vehicleType?: VehicleType,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.routeCostingService.findAll(vehicleType, +page, +limit);
  }

  @Get(':id')
  @UseGuards(RbacGuard)
  @Permissions('logistics:costing:view')
  @ApiOperation({ summary: 'Get cost profile by ID' })
  async findOne(@Param('id') id: string) {
    return this.routeCostingService.findOne(id);
  }

  @Post()
  @UseGuards(RbacGuard)
  @Permissions('logistics:costing:manage')
  @ApiOperation({ summary: 'Create a new cost profile' })
  async create(
    @Body() dto: CreateCostProfileDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.routeCostingService.create(dto, userId);
  }

  @Put(':id')
  @UseGuards(RbacGuard)
  @Permissions('logistics:costing:manage')
  @ApiOperation({ summary: 'Update a cost profile' })
  async update(@Param('id') id: string, @Body() dto: UpdateCostProfileDto) {
    return this.routeCostingService.update(id, dto);
  }

  @Post(':id/activate')
  @UseGuards(RbacGuard)
  @Permissions('logistics:costing:manage')
  @ApiOperation({ summary: 'Activate a cost profile' })
  async activate(@Param('id') id: string) {
    return this.routeCostingService.update(id, { isActive: true });
  }

  @Delete(':id')
  @UseGuards(RbacGuard)
  @Permissions('logistics:costing:manage')
  @ApiOperation({ summary: 'Delete a cost profile' })
  async remove(@Param('id') id: string) {
    return this.routeCostingService.remove(id);
  }
}

@ApiTags('Route Costing')
@ApiBearerAuth('JWT-auth')
@Controller('costing')
@UseInterceptors(ResponseInterceptor)
export class CostingCalculatorController {
  constructor(private readonly routeCostingService: RouteCostingService) {}

  @Post('calculate')
  @UseGuards(RbacGuard)
  @Permissions('logistics:costing:view')
  @ApiOperation({ summary: 'Calculate route costing' })
  async calculate(@Body() dto: CalculateCostingDto) {
    return this.routeCostingService.calculateCosting(dto);
  }
}
