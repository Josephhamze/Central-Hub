import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TollPaymentsService } from './toll-payments.service';
import { CreateTollPaymentDto } from './dto/create-toll-payment.dto';
import { UpdateTollPaymentDto } from './dto/update-toll-payment.dto';
import { ReconcileTollPaymentsDto } from './dto/reconcile-toll-payments.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { VehicleType, TollPaymentStatus } from '@prisma/client';

@ApiTags('Toll Payments')
@ApiBearerAuth('JWT-auth')
@Controller('toll-payments')
@UseInterceptors(ResponseInterceptor)
export class TollPaymentsController {
  constructor(private readonly tollPaymentsService: TollPaymentsService) {}

  @Get()
  @UseGuards(RbacGuard)
  @Permissions('logistics:toll_payments:view')
  @ApiOperation({ summary: 'Get all toll payments' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'routeId', required: false })
  @ApiQuery({ name: 'tollStationId', required: false })
  @ApiQuery({ name: 'vehicleType', enum: VehicleType, required: false })
  @ApiQuery({ name: 'status', enum: TollPaymentStatus, required: false })
  @ApiQuery({ name: 'paidByUserId', required: false })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('routeId') routeId?: string,
    @Query('tollStationId') tollStationId?: string,
    @Query('vehicleType') vehicleType?: VehicleType,
    @Query('status') status?: TollPaymentStatus,
    @Query('paidByUserId') paidByUserId?: string,
  ) {
    return this.tollPaymentsService.findAll(+page, +limit, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      routeId,
      tollStationId,
      vehicleType,
      status,
      paidByUserId,
    });
  }

  @Get(':id')
  @UseGuards(RbacGuard)
  @Permissions('logistics:toll_payments:view')
  @ApiOperation({ summary: 'Get toll payment by ID' })
  async findOne(@Param('id') id: string) {
    return this.tollPaymentsService.findOne(id);
  }

  @Post()
  @UseGuards(RbacGuard)
  @Permissions('logistics:toll_payments:create')
  @ApiOperation({ summary: 'Create a new toll payment' })
  async create(
    @Body() dto: CreateTollPaymentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.tollPaymentsService.create(dto, userId);
  }

  @Put(':id')
  @UseGuards(RbacGuard)
  @Permissions('logistics:toll_payments:create')
  @ApiOperation({ summary: 'Update a toll payment' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTollPaymentDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('permissions') userPermissions: string[],
  ) {
    return this.tollPaymentsService.update(id, dto, userId, userPermissions);
  }

  @Post(':id/submit')
  @UseGuards(RbacGuard)
  @Permissions('logistics:toll_payments:create')
  @ApiOperation({ summary: 'Submit a toll payment for approval' })
  async submit(@Param('id') id: string) {
    return this.tollPaymentsService.submit(id);
  }

  @Post(':id/approve')
  @UseGuards(RbacGuard)
  @Permissions('logistics:toll_payments:approve')
  @ApiOperation({ summary: 'Approve a toll payment' })
  async approve(@Param('id') id: string) {
    return this.tollPaymentsService.approve(id);
  }

  @Post(':id/post')
  @UseGuards(RbacGuard)
  @Permissions('logistics:toll_payments:post')
  @ApiOperation({ summary: 'Post a toll payment (finalize)' })
  async post(@Param('id') id: string) {
    return this.tollPaymentsService.post(id);
  }

  @Delete(':id')
  @UseGuards(RbacGuard)
  @Permissions('logistics:toll_payments:create')
  @ApiOperation({ summary: 'Delete a toll payment' })
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('permissions') userPermissions: string[],
  ) {
    return this.tollPaymentsService.remove(id, userId, userPermissions);
  }

  @Post('reconcile')
  @UseGuards(RbacGuard)
  @Permissions('logistics:toll_payments:view')
  @ApiOperation({ summary: 'Reconcile expected vs actual toll payments' })
  async reconcile(@Body() dto: ReconcileTollPaymentsDto) {
    return this.tollPaymentsService.reconcile(dto);
  }
}
