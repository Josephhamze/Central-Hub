import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';

@ApiTags('Operations')
@ApiBearerAuth('JWT-auth')
@Controller('operations')
@UseInterceptors(ResponseInterceptor)
export class OperationsController {
  @Get()
  @ApiOperation({ summary: 'Get operations overview (stub)' })
  @ApiResponse({
    status: 200,
    description: 'Operations overview - placeholder implementation',
  })
  async getOverview() {
    return {
      message: 'Operations module - placeholder',
      module: 'operations',
      status: 'not_implemented',
      sections: [
        { name: 'Work Orders', status: 'stub' },
        { name: 'Schedules', status: 'stub' },
        { name: 'Resources', status: 'stub' },
      ],
    };
  }

  @Get('work-orders')
  @ApiOperation({ summary: 'Get work orders (stub)' })
  @ApiResponse({
    status: 200,
    description: 'Work orders - placeholder implementation',
  })
  async getWorkOrders() {
    return {
      message: 'Work orders - placeholder',
      module: 'operations',
      status: 'not_implemented',
      items: [],
      pagination: { page: 1, limit: 20, total: 0 },
    };
  }
}
