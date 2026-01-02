import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StockItemsService } from './stockitems.service';
import { CreateStockItemDto } from './dto/create-stock-item.dto';
import { UpdateStockItemDto } from './dto/update-stock-item.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';

@ApiTags('Stock Items')
@ApiBearerAuth('JWT-auth')
@Controller('stock-items')
@UseInterceptors(ResponseInterceptor)
export class StockItemsController {
  constructor(private readonly stockItemsService: StockItemsService) {}

  @Get()
  @UseGuards(RbacGuard)
  @Permissions('stock:view')
  @ApiOperation({ summary: 'Get all stock items' })
  async findAll(@Query('projectId') projectId?: string, @Query('warehouseId') warehouseId?: string, @Query('page') page = 1, @Query('limit') limit = 20, @Query('search') search?: string) {
    return this.stockItemsService.findAll(projectId, warehouseId, +page, +limit, search);
  }

  @Get(':id')
  @UseGuards(RbacGuard)
  @Permissions('stock:view')
  @ApiOperation({ summary: 'Get stock item by ID' })
  async findOne(@Param('id') id: string) {
    return this.stockItemsService.findOne(id);
  }

  @Post()
  @UseGuards(RbacGuard)
  @Permissions('stock:create')
  @ApiOperation({ summary: 'Create a new stock item' })
  async create(@Body() dto: CreateStockItemDto) {
    return this.stockItemsService.create(dto);
  }

  @Put(':id')
  @UseGuards(RbacGuard)
  @Permissions('stock:update')
  @ApiOperation({ summary: 'Update a stock item' })
  async update(@Param('id') id: string, @Body() dto: UpdateStockItemDto) {
    return this.stockItemsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RbacGuard)
  @Permissions('stock:delete')
  @ApiOperation({ summary: 'Delete a stock item' })
  async remove(@Param('id') id: string) {
    return this.stockItemsService.remove(id);
  }
}
