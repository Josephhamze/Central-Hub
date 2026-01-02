import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WarehousesService } from './warehouses.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';

@ApiTags('Warehouses')
@ApiBearerAuth('JWT-auth')
@Controller('warehouses')
@UseInterceptors(ResponseInterceptor)
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Get()
  @UseGuards(RbacGuard)
  @Permissions('warehouses:view')
  @ApiOperation({ summary: 'Get all warehouses' })
  async findAll(@Query('companyId') companyId?: string, @Query('projectId') projectId?: string, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.warehousesService.findAll(companyId, projectId, +page, +limit);
  }

  @Get(':id')
  @UseGuards(RbacGuard)
  @Permissions('warehouses:view')
  @ApiOperation({ summary: 'Get warehouse by ID' })
  async findOne(@Param('id') id: string) {
    return this.warehousesService.findOne(id);
  }

  @Post()
  @UseGuards(RbacGuard)
  @Permissions('warehouses:create')
  @ApiOperation({ summary: 'Create a new warehouse' })
  async create(@Body() dto: CreateWarehouseDto) {
    return this.warehousesService.create(dto);
  }

  @Put(':id')
  @UseGuards(RbacGuard)
  @Permissions('warehouses:update')
  @ApiOperation({ summary: 'Update a warehouse' })
  async update(@Param('id') id: string, @Body() dto: UpdateWarehouseDto) {
    return this.warehousesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RbacGuard)
  @Permissions('warehouses:delete')
  @ApiOperation({ summary: 'Delete a warehouse' })
  async remove(@Param('id') id: string) {
    return this.warehousesService.remove(id);
  }
}
