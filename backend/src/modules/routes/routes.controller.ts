import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { RoutesService } from './routes.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { CreateTollDto } from './dto/create-toll.dto';
import { SetRouteStationsDto } from './dto/set-route-stations.dto';
import { CreateRouteRequestDto } from './dto/create-route-request.dto';
import { ReviewRouteRequestDto } from './dto/review-route-request.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { VehicleType, RouteRequestStatus } from '@prisma/client';

@ApiTags('Routes')
@ApiBearerAuth('JWT-auth')
@Controller('routes')
@UseInterceptors(ResponseInterceptor)
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Get()
  @UseGuards(RbacGuard)
  @Permissions('logistics:routes:view')
  @ApiOperation({ summary: 'Get all routes' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'fromCity', required: false })
  @ApiQuery({ name: 'toCity', required: false })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('fromCity') fromCity?: string,
    @Query('toCity') toCity?: string,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ) {
    return this.routesService.findAll(+page, +limit, {
      fromCity,
      toCity,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      search,
    });
  }

  // Route Request endpoints - MUST come before :id routes to avoid route conflicts
  @Post('requests')
  @UseGuards(RbacGuard)
  @Permissions('quotes:create')
  @ApiOperation({ summary: 'Create a route request (pending approval)' })
  async createRouteRequest(
    @Body() dto: CreateRouteRequestDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.routesService.createRouteRequest(dto, userId);
  }

  @Get('requests')
  @UseGuards(RbacGuard)
  @Permissions('logistics:routes:manage')
  @ApiOperation({ summary: 'Get all route requests (admin only)' })
  async findAllRouteRequests(
    @Query('status') status?: RouteRequestStatus,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.routesService.findAllRouteRequests(+page, +limit, status);
  }

  @Get('requests/:id')
  @UseGuards(RbacGuard)
  @Permissions('logistics:routes:manage')
  @ApiOperation({ summary: 'Get route request by ID' })
  async findOneRouteRequest(@Param('id') id: string) {
    return this.routesService.findOneRouteRequest(id);
  }

  @Post('requests/:id/review')
  @UseGuards(RbacGuard)
  @Permissions('logistics:routes:manage')
  @ApiOperation({ summary: 'Review (approve/reject) a route request' })
  async reviewRouteRequest(
    @Param('id') id: string,
    @Body() dto: ReviewRouteRequestDto,
    @CurrentUser('id') reviewerId: string,
  ) {
    return this.routesService.reviewRouteRequest(id, dto, reviewerId);
  }

  @Get(':id')
  @UseGuards(RbacGuard)
  @Permissions('logistics:routes:view')
  @ApiOperation({ summary: 'Get route by ID' })
  async findOne(@Param('id') id: string) {
    return this.routesService.findOne(id);
  }

  @Get(':id/expected-toll')
  @UseGuards(RbacGuard)
  @Permissions('logistics:routes:view')
  @ApiOperation({ summary: 'Get expected toll total for route by vehicle type' })
  @ApiQuery({ name: 'vehicleType', enum: VehicleType, required: true })
  async getExpectedToll(
    @Param('id') id: string,
    @Query('vehicleType') vehicleType: VehicleType,
  ) {
    const total = await this.routesService.getExpectedTollTotal(id, vehicleType);
    return { routeId: id, vehicleType, total: total.toString() };
  }

  @Post()
  @UseGuards(RbacGuard)
  @Permissions('logistics:routes:manage')
  @ApiOperation({ summary: 'Create a new route' })
  async create(
    @Body() dto: CreateRouteDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.routesService.create(dto, userId);
  }

  @Post('bulk-import')
  @UseGuards(RbacGuard)
  @Permissions('logistics:routes:manage')
  @UseInterceptors(FileInterceptor('file'))
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
  @ApiOperation({ summary: 'Bulk import routes from Excel file' })
  async bulkImport(@UploadedFile() file: any, @CurrentUser('id') userId: string) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    if (!file.mimetype.includes('spreadsheet') && !file.mimetype.includes('excel') && !file.originalname.endsWith('.xlsx') && !file.originalname.endsWith('.xls')) {
      throw new BadRequestException('File must be an Excel file (.xlsx or .xls)');
    }
    return this.routesService.bulkImport(file, userId);
  }

  @Put(':id')
  @UseGuards(RbacGuard)
  @Permissions('logistics:routes:manage')
  @ApiOperation({ summary: 'Update a route' })
  async update(@Param('id') id: string, @Body() dto: UpdateRouteDto) {
    return this.routesService.update(id, dto);
  }

  @Post(':id/deactivate')
  @UseGuards(RbacGuard)
  @Permissions('logistics:routes:manage')
  @ApiOperation({ summary: 'Deactivate a route' })
  async deactivate(@Param('id') id: string) {
    return this.routesService.deactivate(id);
  }

  @Post(':id/stations')
  @UseGuards(RbacGuard)
  @Permissions('logistics:routes:manage')
  @ApiOperation({ summary: 'Set ordered toll stations for a route' })
  async setRouteStations(
    @Param('id') id: string,
    @Body() dto: SetRouteStationsDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.routesService.setRouteStations(id, dto, userId);
  }

  @Get(':id/stations')
  @UseGuards(RbacGuard)
  @Permissions('logistics:routes:view')
  @ApiOperation({ summary: 'Get toll stations for a route' })
  async getRouteStations(@Param('id') id: string) {
    const route = await this.routesService.findOne(id);
    return route.tollStations;
  }

  @Delete(':id')
  @UseGuards(RbacGuard)
  @Permissions('logistics:routes:manage')
  @ApiOperation({ summary: 'Delete a route' })
  async remove(@Param('id') id: string) {
    return this.routesService.remove(id);
  }

  @Post('tolls')
  @UseGuards(RbacGuard)
  @Permissions('logistics:routes:manage')
  @ApiOperation({ summary: 'Add a toll to a route (legacy)' })
  async addToll(@Body() dto: CreateTollDto) {
    return this.routesService.addToll(dto);
  }

  @Delete('tolls/:id')
  @UseGuards(RbacGuard)
  @Permissions('logistics:routes:manage')
  @ApiOperation({ summary: 'Remove a toll (legacy)' })
  async removeToll(@Param('id') id: string) {
    return this.routesService.removeToll(id);
  }
}
