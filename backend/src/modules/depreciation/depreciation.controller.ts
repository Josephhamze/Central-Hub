import {
  Controller,
  Get,
  Post,
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
import { DepreciationService } from './depreciation.service';
import { CreateDepreciationProfileDto } from './dto/create-profile.dto';
import { RunMonthlyDepreciationDto } from './dto/run-monthly.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';

@ApiTags('Depreciation')
@ApiBearerAuth('JWT-auth')
@Controller('depreciation')
@UseInterceptors(ResponseInterceptor)
@UseGuards(RbacGuard)
export class DepreciationController {
  constructor(private readonly depreciationService: DepreciationService) {}

  @Get()
  @Permissions('depreciation:view')
  @ApiOperation({ summary: 'Get all depreciation profiles' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of depreciation profiles' })
  async findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.depreciationService.findAll(page, limit);
  }

  @Get('assets/:assetId')
  @Permissions('depreciation:view')
  @ApiOperation({ summary: 'Get depreciation profile for an asset' })
  @ApiResponse({ status: 200, description: 'Depreciation profile' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async findOne(@Param('assetId') assetId: string) {
    return this.depreciationService.findOne(assetId);
  }

  @Post('profiles')
  @Permissions('depreciation:manage')
  @ApiOperation({ summary: 'Create a depreciation profile' })
  @ApiResponse({ status: 201, description: 'Profile created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or profile already exists' })
  async createProfile(@Body() dto: CreateDepreciationProfileDto) {
    return this.depreciationService.createProfile(dto);
  }

  @Post('run-monthly')
  @Permissions('depreciation:manage')
  @ApiOperation({ summary: 'Run monthly depreciation calculation' })
  @ApiResponse({ status: 200, description: 'Monthly depreciation calculated' })
  async runMonthly(
    @Body() dto: RunMonthlyDepreciationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.depreciationService.runMonthly(dto, userId);
  }

  @Post('post/:assetId/:period')
  @Permissions('depreciation:manage')
  @ApiOperation({ summary: 'Post a depreciation entry' })
  @ApiResponse({ status: 200, description: 'Entry posted successfully' })
  @ApiResponse({ status: 404, description: 'Entry not found' })
  async postEntry(
    @Param('assetId') assetId: string,
    @Param('period') period: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.depreciationService.postEntry(assetId, period, userId);
  }

  @Post('post-period/:period')
  @Permissions('depreciation:manage')
  @ApiOperation({ summary: 'Post all entries for a period' })
  @ApiResponse({ status: 200, description: 'Entries posted' })
  async postAllForPeriod(
    @Param('period') period: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.depreciationService.postAllForPeriod(period, userId);
  }
}
