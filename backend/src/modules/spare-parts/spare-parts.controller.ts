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
import { SparePartsService } from './spare-parts.service';
import { CreateSparePartDto } from './dto/create-spare-part.dto';
import { UpdateSparePartDto } from './dto/update-spare-part.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';

@ApiTags('Spare Parts')
@ApiBearerAuth('JWT-auth')
@Controller('spare-parts')
@UseInterceptors(ResponseInterceptor)
@UseGuards(RbacGuard)
export class SparePartsController {
  constructor(private readonly sparePartsService: SparePartsService) {}

  @Get()
  @Permissions('parts:view')
  @ApiOperation({ summary: 'Get all spare parts' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'warehouseId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of spare parts' })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.sparePartsService.findAll(page, limit, search, warehouseId);
  }

  @Get('low-stock')
  @Permissions('parts:view')
  @ApiOperation({ summary: 'Get spare parts with low stock' })
  @ApiResponse({ status: 200, description: 'List of low stock parts' })
  async getLowStock() {
    return this.sparePartsService.getLowStock();
  }

  @Get(':id')
  @Permissions('parts:view')
  @ApiOperation({ summary: 'Get spare part by ID' })
  @ApiResponse({ status: 200, description: 'Spare part details' })
  @ApiResponse({ status: 404, description: 'Spare part not found' })
  async findOne(@Param('id') id: string) {
    return this.sparePartsService.findOne(id);
  }

  @Post()
  @Permissions('parts:manage')
  @ApiOperation({ summary: 'Create a new spare part' })
  @ApiResponse({ status: 201, description: 'Spare part created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or SKU already exists' })
  async create(@Body() dto: CreateSparePartDto) {
    return this.sparePartsService.create(dto);
  }

  @Put(':id')
  @Permissions('parts:manage')
  @ApiOperation({ summary: 'Update a spare part' })
  @ApiResponse({ status: 200, description: 'Spare part updated successfully' })
  @ApiResponse({ status: 404, description: 'Spare part not found' })
  async update(@Param('id') id: string, @Body() dto: UpdateSparePartDto) {
    return this.sparePartsService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('parts:manage')
  @ApiOperation({ summary: 'Delete a spare part' })
  @ApiResponse({ status: 200, description: 'Spare part deleted successfully' })
  @ApiResponse({ status: 404, description: 'Spare part not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete part with usage history' })
  async remove(@Param('id') id: string) {
    return this.sparePartsService.remove(id);
  }
}
