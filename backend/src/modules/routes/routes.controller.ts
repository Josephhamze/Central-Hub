import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RoutesService } from './routes.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { CreateTollDto } from './dto/create-toll.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';

@ApiTags('Routes')
@ApiBearerAuth('JWT-auth')
@Controller('routes')
@UseInterceptors(ResponseInterceptor)
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Get()
  @UseGuards(RbacGuard)
  @Permissions('routes:view')
  @ApiOperation({ summary: 'Get all routes' })
  async findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.routesService.findAll(+page, +limit);
  }

  @Get(':id')
  @UseGuards(RbacGuard)
  @Permissions('routes:view')
  @ApiOperation({ summary: 'Get route by ID' })
  async findOne(@Param('id') id: string) {
    return this.routesService.findOne(id);
  }

  @Post()
  @UseGuards(RbacGuard)
  @Permissions('routes:create')
  @ApiOperation({ summary: 'Create a new route' })
  async create(@Body() dto: CreateRouteDto) {
    return this.routesService.create(dto);
  }

  @Put(':id')
  @UseGuards(RbacGuard)
  @Permissions('routes:update')
  @ApiOperation({ summary: 'Update a route' })
  async update(@Param('id') id: string, @Body() dto: UpdateRouteDto) {
    return this.routesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RbacGuard)
  @Permissions('routes:delete')
  @ApiOperation({ summary: 'Delete a route' })
  async remove(@Param('id') id: string) {
    return this.routesService.remove(id);
  }

  @Post('tolls')
  @UseGuards(RbacGuard)
  @Permissions('routes:create')
  @ApiOperation({ summary: 'Add a toll to a route' })
  async addToll(@Body() dto: CreateTollDto) {
    return this.routesService.addToll(dto);
  }

  @Delete('tolls/:id')
  @UseGuards(RbacGuard)
  @Permissions('routes:delete')
  @ApiOperation({ summary: 'Remove a toll' })
  async removeToll(@Param('id') id: string) {
    return this.routesService.removeToll(id);
  }
}
