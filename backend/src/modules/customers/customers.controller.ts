import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';

@ApiTags('Customers')
@ApiBearerAuth('JWT-auth')
@Controller('customers')
@UseInterceptors(ResponseInterceptor)
export class CustomersController {
  @Get()
  @ApiOperation({ summary: 'Get customers overview (stub)' })
  @ApiResponse({
    status: 200,
    description: 'Customers & sales overview - placeholder implementation',
  })
  async getOverview() {
    return {
      message: 'Customers & sales module - placeholder',
      module: 'customers',
      status: 'not_implemented',
      sections: [
        { name: 'Customer Directory', status: 'stub' },
        { name: 'Orders', status: 'stub' },
        { name: 'Quotes', status: 'stub' },
        { name: 'Contracts', status: 'stub' },
      ],
    };
  }

  @Get('directory')
  @ApiOperation({ summary: 'Get customer directory (stub)' })
  @ApiResponse({
    status: 200,
    description: 'Customer directory - placeholder implementation',
  })
  async getCustomers() {
    return {
      message: 'Customer directory - placeholder',
      module: 'customers',
      status: 'not_implemented',
      items: [],
      pagination: { page: 1, limit: 20, total: 0 },
    };
  }

  @Get('orders')
  @ApiOperation({ summary: 'Get orders (stub)' })
  @ApiResponse({
    status: 200,
    description: 'Orders - placeholder implementation',
  })
  async getOrders() {
    return {
      message: 'Orders - placeholder',
      module: 'customers',
      status: 'not_implemented',
      items: [],
      pagination: { page: 1, limit: 20, total: 0 },
    };
  }
}
