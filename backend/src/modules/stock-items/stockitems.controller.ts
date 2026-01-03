import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, UseInterceptors, UploadedFile, UseInterceptors as UseInterceptorsDecorator } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BadRequestException } from '@nestjs/common';
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
  async findAll(@Query('companyId') companyId?: string, @Query('projectId') projectId?: string, @Query('warehouseId') warehouseId?: string, @Query('page') page = 1, @Query('limit') limit = 20, @Query('search') search?: string) {
    return this.stockItemsService.findAll(companyId, projectId, warehouseId, +page, +limit, search);
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

  @Post('bulk-import')
  @UseGuards(RbacGuard)
  @Permissions('stock:create')
  @UseInterceptorsDecorator(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Bulk import stock items from Excel file' })
  async bulkImport(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    if (!file.mimetype.includes('spreadsheet') && !file.mimetype.includes('excel') && !file.originalname.endsWith('.xlsx') && !file.originalname.endsWith('.xls')) {
      throw new BadRequestException('File must be an Excel file (.xlsx or .xls)');
    }
    return this.stockItemsService.bulkImport(file);
  }

  @Delete(':id')
  @UseGuards(RbacGuard)
  @Permissions('stock:delete')
  @ApiOperation({ summary: 'Delete a stock item' })
  async remove(@Param('id') id: string) {
    return this.stockItemsService.remove(id);
  }
}
