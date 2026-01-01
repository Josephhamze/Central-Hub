import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';

@ApiTags('Assets')
@ApiBearerAuth('JWT-auth')
@Controller('assets')
@UseInterceptors(ResponseInterceptor)
export class AssetsController {
  @Get()
  @ApiOperation({ summary: 'Get assets overview (stub)' })
  @ApiResponse({
    status: 200,
    description: 'Assets & maintenance overview - placeholder implementation',
  })
  async getOverview() {
    return {
      message: 'Assets & maintenance module - placeholder',
      module: 'assets',
      status: 'not_implemented',
      sections: [
        { name: 'Asset Registry', status: 'stub' },
        { name: 'Maintenance Schedules', status: 'stub' },
        { name: 'Work Orders', status: 'stub' },
        { name: 'Parts & Spares', status: 'stub' },
      ],
    };
  }

  @Get('registry')
  @ApiOperation({ summary: 'Get asset registry (stub)' })
  @ApiResponse({
    status: 200,
    description: 'Asset registry - placeholder implementation',
  })
  async getAssets() {
    return {
      message: 'Asset registry - placeholder',
      module: 'assets',
      status: 'not_implemented',
      items: [],
      pagination: { page: 1, limit: 20, total: 0 },
    };
  }

  @Get('maintenance')
  @ApiOperation({ summary: 'Get maintenance schedules (stub)' })
  @ApiResponse({
    status: 200,
    description: 'Maintenance schedules - placeholder implementation',
  })
  async getMaintenanceSchedules() {
    return {
      message: 'Maintenance schedules - placeholder',
      module: 'assets',
      status: 'not_implemented',
      items: [],
      pagination: { page: 1, limit: 20, total: 0 },
    };
  }
}
