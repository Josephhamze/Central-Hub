import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';

@ApiTags('Costing')
@ApiBearerAuth('JWT-auth')
@Controller('costing')
@UseInterceptors(ResponseInterceptor)
export class CostingController {
  @Get()
  @ApiOperation({ summary: 'Get costing overview (stub)' })
  @ApiResponse({
    status: 200,
    description: 'Costing overview - placeholder implementation',
  })
  async getOverview() {
    return {
      message: 'Costing module - placeholder',
      module: 'costing',
      status: 'not_implemented',
      sections: [
        { name: 'Cost Centers', status: 'stub' },
        { name: 'Cost Items', status: 'stub' },
        { name: 'Cost Analysis', status: 'stub' },
      ],
    };
  }

  @Get('centers')
  @ApiOperation({ summary: 'Get cost centers (stub)' })
  @ApiResponse({
    status: 200,
    description: 'Cost centers - placeholder implementation',
  })
  async getCostCenters() {
    return {
      message: 'Cost centers - placeholder',
      module: 'costing',
      status: 'not_implemented',
      items: [],
      pagination: { page: 1, limit: 20, total: 0 },
    };
  }
}
