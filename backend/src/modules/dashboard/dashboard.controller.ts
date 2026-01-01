import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT-auth')
@Controller('dashboard')
@UseInterceptors(ResponseInterceptor)
export class DashboardController {
  @Get()
  @ApiOperation({ summary: 'Get dashboard overview (stub)' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard overview - placeholder implementation',
  })
  async getOverview() {
    return {
      message: 'Dashboard module - placeholder',
      module: 'dashboard',
      status: 'not_implemented',
      widgets: [],
      metrics: [],
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics (stub)' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics - placeholder implementation',
  })
  async getStats() {
    return {
      message: 'Dashboard statistics - placeholder',
      module: 'dashboard',
      status: 'not_implemented',
      data: {},
    };
  }
}
