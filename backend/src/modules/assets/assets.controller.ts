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
import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';
import { AssetStatus } from '@prisma/client';

@ApiTags('Assets')
@ApiBearerAuth('JWT-auth')
@Controller('assets')
@UseInterceptors(ResponseInterceptor)
@UseGuards(RbacGuard)
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get('overview')
  @Permissions('assets:view')
  @ApiOperation({ summary: 'Get assets overview and KPIs' })
  @ApiResponse({ status: 200, description: 'Assets overview' })
  async getOverview() {
    return this.assetsService.getOverview();
  }

  @Get()
  @Permissions('assets:view')
  @ApiOperation({ summary: 'Get all assets' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: AssetStatus })
  @ApiResponse({ status: 200, description: 'List of assets' })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
    @Query('status') status?: AssetStatus,
  ) {
    return this.assetsService.findAll(page, limit, search, status);
  }

  @Get(':id')
  @Permissions('assets:view')
  @ApiOperation({ summary: 'Get asset by ID' })
  @ApiResponse({ status: 200, description: 'Asset details' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async findOne(@Param('id') id: string) {
    return this.assetsService.findOne(id);
  }

  @Get(':id/history')
  @Permissions('assets:view')
  @ApiOperation({ summary: 'Get asset history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Asset history' })
  async getHistory(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.assetsService.getHistory(id, page, limit);
  }

  @Post()
  @Permissions('assets:create')
  @ApiOperation({ summary: 'Create a new asset' })
  @ApiResponse({ status: 201, description: 'Asset created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or asset tag already exists' })
  async create(
    @Body() dto: CreateAssetDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.assetsService.create(dto, userId);
  }

  @Put(':id')
  @Permissions('assets:update')
  @ApiOperation({ summary: 'Update an asset' })
  @ApiResponse({ status: 200, description: 'Asset updated successfully' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  @ApiResponse({ status: 400, description: 'Cannot update retired asset' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAssetDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.assetsService.update(id, dto, userId);
  }

  @Patch(':id/retire')
  @Permissions('assets:retire')
  @ApiOperation({ summary: 'Retire an asset' })
  @ApiResponse({ status: 200, description: 'Asset retired successfully' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  @ApiResponse({ status: 400, description: 'Cannot retire asset with open work orders' })
  async retire(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.assetsService.retire(id, userId);
  }
}
