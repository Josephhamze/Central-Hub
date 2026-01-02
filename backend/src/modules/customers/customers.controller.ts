import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';
import { CustomerType } from '@prisma/client';

@ApiTags('Customers')
@ApiBearerAuth('JWT-auth')
@Controller('customers')
@UseInterceptors(ResponseInterceptor)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @UseGuards(RbacGuard)
  @Permissions('customers:view')
  @ApiOperation({ summary: 'Get all customers' })
  async findAll(@Query('type') type?: CustomerType, @Query('page') page = 1, @Query('limit') limit = 20, @Query('search') search?: string) {
    return this.customersService.findAll(type, +page, +limit, search);
  }

  @Get(':id')
  @UseGuards(RbacGuard)
  @Permissions('customers:view')
  @ApiOperation({ summary: 'Get customer by ID' })
  async findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Post()
  @UseGuards(RbacGuard)
  @Permissions('customers:create')
  @ApiOperation({ summary: 'Create a new customer' })
  async create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  @Put(':id')
  @UseGuards(RbacGuard)
  @Permissions('customers:update')
  @ApiOperation({ summary: 'Update a customer' })
  async update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customersService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RbacGuard)
  @Permissions('customers:delete')
  @ApiOperation({ summary: 'Delete a customer' })
  async remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }
}
