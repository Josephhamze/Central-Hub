import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Root')
@Controller()
export class RootController {
  @Get()
  @ApiOperation({ summary: 'API root endpoint' })
  getRoot() {
    return {
      message: 'Operations Control Panel API',
      version: '1.0',
      documentation: '/api/docs',
      health: '/api/v1/health',
    };
  }
}
