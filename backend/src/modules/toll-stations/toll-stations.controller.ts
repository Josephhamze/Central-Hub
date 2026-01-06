import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TollStationsService } from './toll-stations.service';
import { CreateTollStationDto } from './dto/create-toll-station.dto';
import { UpdateTollStationDto } from './dto/update-toll-station.dto';
import { CreateTollRateDto } from './dto/create-toll-rate.dto';
import { UpdateTollRateDto } from './dto/update-toll-rate.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';

@ApiTags('Toll Stations')
@ApiBearerAuth('JWT-auth')
@Controller('toll-stations')
@UseInterceptors(ResponseInterceptor)
export class TollStationsController {
  constructor(private readonly tollStationsService: TollStationsService) {}

  @Get()
  @UseGuards(RbacGuard)
  @Permissions('logistics:tolls:view')
  @ApiOperation({ summary: 'Get all toll stations' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ) {
    return this.tollStationsService.findAll(+page, +limit, {
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      search,
    });
  }

  @Get(':id')
  @UseGuards(RbacGuard)
  @Permissions('logistics:tolls:view')
  @ApiOperation({ summary: 'Get toll station by ID' })
  async findOne(@Param('id') id: string) {
    return this.tollStationsService.findOne(id);
  }

  @Post()
  @UseGuards(RbacGuard)
  @Permissions('logistics:tolls:manage')
  @ApiOperation({ summary: 'Create a new toll station' })
  async create(@Body() dto: CreateTollStationDto) {
    return this.tollStationsService.create(dto);
  }

  @Put(':id')
  @UseGuards(RbacGuard)
  @Permissions('logistics:tolls:manage')
  @ApiOperation({ summary: 'Update a toll station' })
  async update(@Param('id') id: string, @Body() dto: UpdateTollStationDto) {
    return this.tollStationsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RbacGuard)
  @Permissions('logistics:tolls:manage')
  @ApiOperation({ summary: 'Delete a toll station' })
  async remove(@Param('id') id: string) {
    return this.tollStationsService.remove(id);
  }

  // Toll Rate endpoints
  @Get(':id/rates')
  @UseGuards(RbacGuard)
  @Permissions('logistics:tolls:view')
  @ApiOperation({ summary: 'Get toll rates for a station' })
  @ApiQuery({ name: 'vehicleType', required: false })
  async getRates(@Param('id') id: string, @Query('vehicleType') vehicleType?: string) {
    return this.tollStationsService.getRates(id, vehicleType);
  }

  @Post(':id/rates')
  @UseGuards(RbacGuard)
  @Permissions('logistics:tolls:manage')
  @ApiOperation({ summary: 'Create a toll rate for a station' })
  async createRate(@Param('id') id: string, @Body() dto: CreateTollRateDto) {
    return this.tollStationsService.createRate(id, dto);
  }

  @Put(':id/rates/:rateId')
  @UseGuards(RbacGuard)
  @Permissions('logistics:tolls:manage')
  @ApiOperation({ summary: 'Update a toll rate' })
  async updateRate(
    @Param('id') id: string,
    @Param('rateId') rateId: string,
    @Body() dto: UpdateTollRateDto,
  ) {
    return this.tollStationsService.updateRate(id, rateId, dto);
  }

  @Delete(':id/rates/:rateId')
  @UseGuards(RbacGuard)
  @Permissions('logistics:tolls:manage')
  @ApiOperation({ summary: 'Delete a toll rate' })
  async removeRate(@Param('id') id: string, @Param('rateId') rateId: string) {
    return this.tollStationsService.removeRate(id, rateId);
  }
}
