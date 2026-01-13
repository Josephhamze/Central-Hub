import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { StockLevelsService } from './stock-levels.service';
import { CreateStockLevelDto } from './dto/create-stock-level.dto';
import { UpdateStockLevelDto } from './dto/update-stock-level.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../../common/guards/rbac.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@Controller('quarry-production/stock-levels')
@UseGuards(JwtAuthGuard, RbacGuard)
export class StockLevelsController {
  constructor(private readonly stockLevelsService: StockLevelsService) {}

  @Post()
  @Permissions('quarry:stock:view')
  create(
    @Body() createDto: CreateStockLevelDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.stockLevelsService.createOrUpdate(createDto, userId);
  }

  @Get()
  @Permissions('quarry:stock:view')
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('productTypeId') productTypeId?: string,
    @Query('stockpileLocationId') stockpileLocationId?: string,
  ) {
    return this.stockLevelsService.findAll(
      page,
      limit,
      dateFrom,
      dateTo,
      productTypeId,
      stockpileLocationId,
    );
  }

  @Get('current')
  @Permissions('quarry:stock:view')
  getCurrentStock(
    @Query('productTypeId') productTypeId?: string,
    @Query('stockpileLocationId') stockpileLocationId?: string,
  ) {
    return this.stockLevelsService.getCurrentStock(productTypeId, stockpileLocationId);
  }

  @Get(':id')
  @Permissions('quarry:stock:view')
  findOne(@Param('id') id: string) {
    return this.stockLevelsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('quarry:stock:view')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateStockLevelDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.stockLevelsService.createOrUpdate(updateDto as any, userId);
  }

  @Post(':id/adjust')
  @Permissions('quarry:stock:adjust')
  adjustStock(
    @Param('id') id: string,
    @Body() adjustDto: AdjustStockDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.stockLevelsService.adjustStock(id, adjustDto, userId);
  }

  @Post('recalculate')
  @Permissions('quarry:stock:view')
  recalculateStock(
    @Body() body: { date: string; projectId: string; productTypeId: string; stockpileLocationId: string },
  ) {
    return this.stockLevelsService.recalculateStock(
      new Date(body.date),
      body.projectId,
      body.productTypeId,
      body.stockpileLocationId,
    );
  }
}
