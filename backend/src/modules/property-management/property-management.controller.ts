import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

// Services
import { PropertyManagementService, CreatePropertyDto, UpdatePropertyDto, CreatePropertyUnitDto, UpdatePropertyUnitDto } from './property-management.service';
import { TenantService, CreateTenantDto, UpdateTenantDto } from './tenant.service';
import { LeaseService, CreateLeaseDto, UpdateLeaseDto } from './lease.service';
import { RentService, CreateRentPaymentDto, UpdateRentPaymentDto } from './rent.service';
import { ExpenseService, CreateExpenseDto, UpdateExpenseDto } from './expense.service';
import { UtilityService, CreateUtilityBillDto, UpdateUtilityBillDto } from './utility.service';
import { MaintenanceService, CreateMaintenanceJobDto, UpdateMaintenanceJobDto } from './maintenance.service';
import { PropertyKPIService } from './property-kpi.service';

// Enums
import {
  PropertyType,
  PropertyStatus,
  PropertyHealthStatus,
  OwnershipType,
  TenantStatus,
  LeaseType,
  PaymentMethod,
  RentPaymentStatus,
  ExpenseCategory,
  UtilityType,
  BillStatus,
  BillAllocation,
  MaintenanceStatus,
  MaintenancePriority,
} from '@prisma/client';

@ApiTags('Property Management')
@ApiBearerAuth('JWT-auth')
@Controller('property-management')
@UseInterceptors(ResponseInterceptor)
@UseGuards(RbacGuard)
export class PropertyManagementController {
  constructor(
    private readonly propertyService: PropertyManagementService,
    private readonly tenantService: TenantService,
    private readonly leaseService: LeaseService,
    private readonly rentService: RentService,
    private readonly expenseService: ExpenseService,
    private readonly utilityService: UtilityService,
    private readonly maintenanceService: MaintenanceService,
    private readonly kpiService: PropertyKPIService,
  ) {}

  // ==========================================================================
  // PROPERTIES
  // ==========================================================================

  @Post('properties')
  @ApiOperation({ summary: 'Create a new property' })
  @Permissions('properties:create')
  async createProperty(
    @Body() dto: CreatePropertyDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.propertyService.createProperty(dto, userId);
  }

  @Get('properties')
  @ApiOperation({ summary: 'List all properties' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'propertyType', required: false, enum: PropertyType })
  @ApiQuery({ name: 'status', required: false, enum: PropertyStatus })
  @ApiQuery({ name: 'healthStatus', required: false, enum: PropertyHealthStatus })
  @ApiQuery({ name: 'city', required: false, type: String })
  @ApiQuery({ name: 'ownershipType', required: false, enum: OwnershipType })
  @Permissions('properties:view')
  async findAllProperties(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('propertyType') propertyType?: PropertyType,
    @Query('status') status?: PropertyStatus,
    @Query('healthStatus') healthStatus?: PropertyHealthStatus,
    @Query('city') city?: string,
    @Query('ownershipType') ownershipType?: OwnershipType,
  ) {
    return this.propertyService.findAllProperties({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search,
      propertyType,
      status,
      healthStatus,
      city,
      ownershipType,
    });
  }

  @Get('properties/summary')
  @ApiOperation({ summary: 'Get property portfolio summary' })
  @Permissions('properties:view')
  async getPropertySummary() {
    return this.propertyService.getPropertySummary();
  }

  @Get('properties/vacant')
  @ApiOperation({ summary: 'Get all vacant properties' })
  @Permissions('properties:view')
  async getVacantProperties() {
    return this.propertyService.getVacantProperties();
  }

  @Get('properties/:id')
  @ApiOperation({ summary: 'Get property by ID' })
  @Permissions('properties:view')
  async findPropertyById(@Param('id') id: string) {
    return this.propertyService.findPropertyById(id);
  }

  @Put('properties/:id')
  @ApiOperation({ summary: 'Update a property' })
  @Permissions('properties:edit')
  async updateProperty(
    @Param('id') id: string,
    @Body() dto: UpdatePropertyDto,
  ) {
    return this.propertyService.updateProperty(id, dto);
  }

  @Patch('properties/:id/status')
  @ApiOperation({ summary: 'Update property status' })
  @Permissions('properties:edit')
  async updatePropertyStatus(
    @Param('id') id: string,
    @Body('status') status: PropertyStatus,
  ) {
    return this.propertyService.updatePropertyStatus(id, status);
  }

  @Delete('properties/:id')
  @ApiOperation({ summary: 'Delete a property' })
  @Permissions('properties:delete')
  async deleteProperty(@Param('id') id: string) {
    return this.propertyService.deleteProperty(id);
  }

  // ==========================================================================
  // PROPERTY UNITS
  // ==========================================================================

  @Post('units')
  @ApiOperation({ summary: 'Create a new property unit' })
  @Permissions('properties:edit')
  async createPropertyUnit(@Body() dto: CreatePropertyUnitDto) {
    return this.propertyService.createPropertyUnit(dto);
  }

  @Get('properties/:propertyId/units')
  @ApiOperation({ summary: 'List units for a property' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: PropertyStatus })
  @Permissions('properties:view')
  async findPropertyUnits(
    @Param('propertyId') propertyId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: PropertyStatus,
  ) {
    return this.propertyService.findAllPropertyUnits(propertyId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
    });
  }

  @Get('units/vacant')
  @ApiOperation({ summary: 'Get all vacant units' })
  @Permissions('properties:view')
  async getVacantUnits() {
    return this.propertyService.getVacantUnits();
  }

  @Get('units/:id')
  @ApiOperation({ summary: 'Get unit by ID' })
  @Permissions('properties:view')
  async findPropertyUnitById(@Param('id') id: string) {
    return this.propertyService.findPropertyUnitById(id);
  }

  @Put('units/:id')
  @ApiOperation({ summary: 'Update a property unit' })
  @Permissions('properties:edit')
  async updatePropertyUnit(
    @Param('id') id: string,
    @Body() dto: UpdatePropertyUnitDto,
  ) {
    return this.propertyService.updatePropertyUnit(id, dto);
  }

  @Delete('units/:id')
  @ApiOperation({ summary: 'Delete a property unit' })
  @Permissions('properties:delete')
  async deletePropertyUnit(@Param('id') id: string) {
    return this.propertyService.deletePropertyUnit(id);
  }

  // ==========================================================================
  // TENANTS
  // ==========================================================================

  @Post('tenants')
  @ApiOperation({ summary: 'Create a new tenant' })
  @Permissions('tenants:create')
  async createTenant(
    @Body() dto: CreateTenantDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.tenantService.createTenant(dto, userId);
  }

  @Get('tenants')
  @ApiOperation({ summary: 'List all tenants' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: TenantStatus })
  @Permissions('tenants:view')
  async findAllTenants(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: TenantStatus,
  ) {
    return this.tenantService.findAllTenants({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search,
      status,
    });
  }

  @Get('tenants/statistics')
  @ApiOperation({ summary: 'Get tenant statistics' })
  @Permissions('tenants:view')
  async getTenantStatistics() {
    return this.tenantService.getTenantStatistics();
  }

  @Get('tenants/arrears')
  @ApiOperation({ summary: 'Get tenants in arrears' })
  @Permissions('tenants:view')
  async getTenantsInArrears() {
    return this.tenantService.getTenantsInArrears();
  }

  @Get('tenants/:id')
  @ApiOperation({ summary: 'Get tenant by ID' })
  @Permissions('tenants:view')
  async findTenantById(@Param('id') id: string) {
    return this.tenantService.findTenantById(id);
  }

  @Get('tenants/:id/ledger')
  @ApiOperation({ summary: 'Get tenant ledger' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @Permissions('tenants:view')
  async getTenantLedger(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.tenantService.getTenantLedger(id, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Put('tenants/:id')
  @ApiOperation({ summary: 'Update a tenant' })
  @Permissions('tenants:edit')
  async updateTenant(
    @Param('id') id: string,
    @Body() dto: UpdateTenantDto,
  ) {
    return this.tenantService.updateTenant(id, dto);
  }

  @Patch('tenants/:id/status')
  @ApiOperation({ summary: 'Update tenant status' })
  @Permissions('tenants:edit')
  async updateTenantStatus(
    @Param('id') id: string,
    @Body('status') status: TenantStatus,
    @Body('reason') reason?: string,
  ) {
    return this.tenantService.updateTenantStatus(id, status, reason);
  }

  @Delete('tenants/:id')
  @ApiOperation({ summary: 'Delete a tenant' })
  @Permissions('tenants:delete')
  async deleteTenant(@Param('id') id: string) {
    return this.tenantService.deleteTenant(id);
  }

  // ==========================================================================
  // LEASES
  // ==========================================================================

  @Post('leases')
  @ApiOperation({ summary: 'Create a new lease' })
  @Permissions('leases:create')
  async createLease(
    @Body() dto: CreateLeaseDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.leaseService.createLease(dto, userId);
  }

  @Get('leases')
  @ApiOperation({ summary: 'List all leases' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'propertyId', required: false, type: String })
  @ApiQuery({ name: 'tenantId', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'leaseType', required: false, enum: LeaseType })
  @ApiQuery({ name: 'expiringWithinDays', required: false, type: Number })
  @Permissions('leases:view')
  async findAllLeases(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('propertyId') propertyId?: string,
    @Query('tenantId') tenantId?: string,
    @Query('isActive') isActive?: string,
    @Query('leaseType') leaseType?: LeaseType,
    @Query('expiringWithinDays') expiringWithinDays?: number,
  ) {
    return this.leaseService.findAllLeases({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      propertyId,
      tenantId,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      leaseType,
      expiringWithinDays: expiringWithinDays ? Number(expiringWithinDays) : undefined,
    });
  }

  @Get('leases/statistics')
  @ApiOperation({ summary: 'Get lease statistics' })
  @Permissions('leases:view')
  async getLeaseStatistics() {
    return this.leaseService.getLeaseStatistics();
  }

  @Get('leases/expiring')
  @ApiOperation({ summary: 'Get expiring leases' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  @Permissions('leases:view')
  async getExpiringLeases(@Query('days') days?: number) {
    return this.leaseService.getExpiringLeases(days ? Number(days) : 30);
  }

  @Get('leases/rent-roll')
  @ApiOperation({ summary: 'Get rent roll' })
  @ApiQuery({ name: 'propertyId', required: false, type: String })
  @Permissions('leases:view')
  async getRentRoll(@Query('propertyId') propertyId?: string) {
    return this.leaseService.getRentRoll({ propertyId });
  }

  @Get('leases/:id')
  @ApiOperation({ summary: 'Get lease by ID' })
  @Permissions('leases:view')
  async findLeaseById(@Param('id') id: string) {
    return this.leaseService.findLeaseById(id);
  }

  @Get('leases/:id/schedules')
  @ApiOperation({ summary: 'Get rent schedules for a lease' })
  @ApiQuery({ name: 'status', required: false, enum: RentPaymentStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Permissions('leases:view')
  async getRentSchedules(
    @Param('id') id: string,
    @Query('status') status?: RentPaymentStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.leaseService.getRentSchedules(id, {
      status,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Put('leases/:id')
  @ApiOperation({ summary: 'Update a lease' })
  @Permissions('leases:edit')
  async updateLease(
    @Param('id') id: string,
    @Body() dto: UpdateLeaseDto,
  ) {
    return this.leaseService.updateLease(id, dto);
  }

  @Post('leases/:id/terminate')
  @ApiOperation({ summary: 'Terminate a lease' })
  @Permissions('leases:edit')
  async terminateLease(
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.leaseService.terminateLease(id, reason);
  }

  @Post('leases/:id/renew')
  @ApiOperation({ summary: 'Renew a lease' })
  @Permissions('leases:edit')
  async renewLease(
    @Param('id') id: string,
    @Body('newEndDate') newEndDate: string,
    @Body('newRentAmount') newRentAmount?: number,
  ) {
    return this.leaseService.renewLease(id, new Date(newEndDate), newRentAmount);
  }

  // ==========================================================================
  // RENT PAYMENTS
  // ==========================================================================

  @Post('payments')
  @ApiOperation({ summary: 'Record a rent payment' })
  @Permissions('payments:create')
  async createPayment(
    @Body() dto: CreateRentPaymentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.rentService.createPayment(dto, userId);
  }

  @Get('payments')
  @ApiOperation({ summary: 'List all payments' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'tenantId', required: false, type: String })
  @ApiQuery({ name: 'leaseId', required: false, type: String })
  @ApiQuery({ name: 'propertyId', required: false, type: String })
  @ApiQuery({ name: 'paymentMethod', required: false, enum: PaymentMethod })
  @ApiQuery({ name: 'status', required: false, enum: RentPaymentStatus })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @Permissions('payments:view')
  async findAllPayments(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('tenantId') tenantId?: string,
    @Query('leaseId') leaseId?: string,
    @Query('propertyId') propertyId?: string,
    @Query('paymentMethod') paymentMethod?: PaymentMethod,
    @Query('status') status?: RentPaymentStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.rentService.findAllPayments({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      tenantId,
      leaseId,
      propertyId,
      paymentMethod,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('payments/statistics')
  @ApiOperation({ summary: 'Get collection statistics' })
  @ApiQuery({ name: 'propertyId', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @Permissions('payments:view')
  async getCollectionStatistics(
    @Query('propertyId') propertyId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.rentService.getCollectionStatistics({
      propertyId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('payments/arrears')
  @ApiOperation({ summary: 'Get arrears report' })
  @Permissions('payments:view')
  async getArrearsReport() {
    return this.rentService.getArrearsReport();
  }

  @Get('payments/:id')
  @ApiOperation({ summary: 'Get payment by ID' })
  @Permissions('payments:view')
  async findPaymentById(@Param('id') id: string) {
    return this.rentService.findPaymentById(id);
  }

  @Put('payments/:id')
  @ApiOperation({ summary: 'Update a payment' })
  @Permissions('payments:edit')
  async updatePayment(
    @Param('id') id: string,
    @Body() dto: UpdateRentPaymentDto,
  ) {
    return this.rentService.updatePayment(id, dto);
  }

  @Post('payments/:id/refund')
  @ApiOperation({ summary: 'Refund a payment' })
  @Permissions('payments:edit')
  async refundPayment(
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.rentService.refundPayment(id, reason);
  }

  @Post('payments/apply-late-fees')
  @ApiOperation({ summary: 'Apply late fees to overdue schedules' })
  @Permissions('payments:edit')
  async applyLateFees() {
    return this.rentService.applyLateFees();
  }

  // ==========================================================================
  // EXPENSES
  // ==========================================================================

  @Post('expenses')
  @ApiOperation({ summary: 'Create a new expense' })
  @Permissions('expenses:create')
  async createExpense(
    @Body() dto: CreateExpenseDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.expenseService.createExpense(dto, userId);
  }

  @Get('expenses')
  @ApiOperation({ summary: 'List all expenses' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'propertyId', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, enum: ExpenseCategory })
  @ApiQuery({ name: 'isPaid', required: false, type: Boolean })
  @ApiQuery({ name: 'isRecurring', required: false, type: Boolean })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @Permissions('expenses:view')
  async findAllExpenses(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('propertyId') propertyId?: string,
    @Query('category') category?: ExpenseCategory,
    @Query('isPaid') isPaid?: string,
    @Query('isRecurring') isRecurring?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.expenseService.findAllExpenses({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      propertyId,
      category,
      isPaid: isPaid === 'true' ? true : isPaid === 'false' ? false : undefined,
      isRecurring: isRecurring === 'true' ? true : isRecurring === 'false' ? false : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('expenses/summary')
  @ApiOperation({ summary: 'Get expense summary' })
  @ApiQuery({ name: 'propertyId', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @Permissions('expenses:view')
  async getExpenseSummary(
    @Query('propertyId') propertyId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.expenseService.getExpenseSummary({
      propertyId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('expenses/unpaid')
  @ApiOperation({ summary: 'Get unpaid expenses' })
  @ApiQuery({ name: 'propertyId', required: false, type: String })
  @Permissions('expenses:view')
  async getUnpaidExpenses(@Query('propertyId') propertyId?: string) {
    return this.expenseService.getUnpaidExpenses(propertyId);
  }

  @Get('expenses/forecast/:propertyId')
  @ApiOperation({ summary: 'Get expense forecast' })
  @ApiQuery({ name: 'months', required: false, type: Number })
  @Permissions('expenses:view')
  async forecastExpenses(
    @Param('propertyId') propertyId: string,
    @Query('months') months?: number,
  ) {
    return this.expenseService.forecastExpenses(propertyId, months ? Number(months) : 12);
  }

  @Get('expenses/:id')
  @ApiOperation({ summary: 'Get expense by ID' })
  @Permissions('expenses:view')
  async findExpenseById(@Param('id') id: string) {
    return this.expenseService.findExpenseById(id);
  }

  @Put('expenses/:id')
  @ApiOperation({ summary: 'Update an expense' })
  @Permissions('expenses:edit')
  async updateExpense(
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expenseService.updateExpense(id, dto);
  }

  @Patch('expenses/:id/pay')
  @ApiOperation({ summary: 'Mark expense as paid' })
  @Permissions('expenses:edit')
  async markExpenseAsPaid(
    @Param('id') id: string,
    @Body('paymentMethod') paymentMethod: PaymentMethod,
    @Body('paymentReference') paymentReference?: string,
  ) {
    return this.expenseService.markAsPaid(id, paymentMethod, paymentReference);
  }

  @Delete('expenses/:id')
  @ApiOperation({ summary: 'Delete an expense' })
  @Permissions('expenses:delete')
  async deleteExpense(@Param('id') id: string) {
    return this.expenseService.deleteExpense(id);
  }

  // ==========================================================================
  // UTILITY BILLS
  // ==========================================================================

  @Post('utilities')
  @ApiOperation({ summary: 'Create a new utility bill' })
  @Permissions('utilities:create')
  async createUtilityBill(
    @Body() dto: CreateUtilityBillDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.utilityService.createBill(dto, userId);
  }

  @Get('utilities')
  @ApiOperation({ summary: 'List all utility bills' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'propertyId', required: false, type: String })
  @ApiQuery({ name: 'unitId', required: false, type: String })
  @ApiQuery({ name: 'utilityType', required: false, enum: UtilityType })
  @ApiQuery({ name: 'status', required: false, enum: BillStatus })
  @ApiQuery({ name: 'allocation', required: false, enum: BillAllocation })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @Permissions('utilities:view')
  async findAllUtilityBills(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('propertyId') propertyId?: string,
    @Query('unitId') unitId?: string,
    @Query('utilityType') utilityType?: UtilityType,
    @Query('status') status?: BillStatus,
    @Query('allocation') allocation?: BillAllocation,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.utilityService.findAllBills({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      propertyId,
      unitId,
      utilityType,
      status,
      allocation,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('utilities/summary')
  @ApiOperation({ summary: 'Get utility summary' })
  @ApiQuery({ name: 'propertyId', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @Permissions('utilities:view')
  async getUtilitySummary(
    @Query('propertyId') propertyId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.utilityService.getUtilitySummary({
      propertyId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('utilities/overdue')
  @ApiOperation({ summary: 'Get overdue utility bills' })
  @ApiQuery({ name: 'propertyId', required: false, type: String })
  @Permissions('utilities:view')
  async getOverdueUtilityBills(@Query('propertyId') propertyId?: string) {
    return this.utilityService.getOverdueBills(propertyId);
  }

  @Get('utilities/consumption/:propertyId')
  @ApiOperation({ summary: 'Get consumption trend' })
  @ApiQuery({ name: 'utilityType', required: true, enum: UtilityType })
  @ApiQuery({ name: 'months', required: false, type: Number })
  @Permissions('utilities:view')
  async getConsumptionTrend(
    @Param('propertyId') propertyId: string,
    @Query('utilityType') utilityType: UtilityType,
    @Query('months') months?: number,
  ) {
    return this.utilityService.getConsumptionTrend(propertyId, utilityType, months ? Number(months) : 12);
  }

  @Get('utilities/:id')
  @ApiOperation({ summary: 'Get utility bill by ID' })
  @Permissions('utilities:view')
  async findUtilityBillById(@Param('id') id: string) {
    return this.utilityService.findBillById(id);
  }

  @Put('utilities/:id')
  @ApiOperation({ summary: 'Update a utility bill' })
  @Permissions('utilities:edit')
  async updateUtilityBill(
    @Param('id') id: string,
    @Body() dto: UpdateUtilityBillDto,
  ) {
    return this.utilityService.updateBill(id, dto);
  }

  @Patch('utilities/:id/pay')
  @ApiOperation({ summary: 'Mark utility bill as paid' })
  @Permissions('utilities:edit')
  async markUtilityBillAsPaid(
    @Param('id') id: string,
    @Body('paidAmount') paidAmount: number,
    @Body('paymentReference') paymentReference?: string,
  ) {
    return this.utilityService.markAsPaid(id, paidAmount, paymentReference);
  }

  @Delete('utilities/:id')
  @ApiOperation({ summary: 'Delete a utility bill' })
  @Permissions('utilities:delete')
  async deleteUtilityBill(@Param('id') id: string) {
    return this.utilityService.deleteBill(id);
  }

  // ==========================================================================
  // MAINTENANCE
  // ==========================================================================

  @Post('maintenance')
  @ApiOperation({ summary: 'Create a new maintenance job' })
  @Permissions('maintenance:create')
  async createMaintenanceJob(
    @Body() dto: CreateMaintenanceJobDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.maintenanceService.createJob(dto, userId);
  }

  @Get('maintenance')
  @ApiOperation({ summary: 'List all maintenance jobs' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'propertyId', required: false, type: String })
  @ApiQuery({ name: 'unitId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: MaintenanceStatus })
  @ApiQuery({ name: 'priority', required: false, enum: MaintenancePriority })
  @ApiQuery({ name: 'category', required: false, enum: ExpenseCategory })
  @Permissions('maintenance:view')
  async findAllMaintenanceJobs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('propertyId') propertyId?: string,
    @Query('unitId') unitId?: string,
    @Query('status') status?: MaintenanceStatus,
    @Query('priority') priority?: MaintenancePriority,
    @Query('category') category?: ExpenseCategory,
  ) {
    return this.maintenanceService.findAllJobs({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      propertyId,
      unitId,
      status,
      priority,
      category,
    });
  }

  @Get('maintenance/summary')
  @ApiOperation({ summary: 'Get maintenance summary' })
  @ApiQuery({ name: 'propertyId', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @Permissions('maintenance:view')
  async getMaintenanceSummary(
    @Query('propertyId') propertyId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.maintenanceService.getMaintenanceSummary({
      propertyId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('maintenance/open')
  @ApiOperation({ summary: 'Get open maintenance jobs' })
  @ApiQuery({ name: 'propertyId', required: false, type: String })
  @Permissions('maintenance:view')
  async getOpenMaintenanceJobs(@Query('propertyId') propertyId?: string) {
    return this.maintenanceService.getOpenJobs(propertyId);
  }

  @Get('maintenance/urgent')
  @ApiOperation({ summary: 'Get urgent maintenance jobs' })
  @Permissions('maintenance:view')
  async getUrgentMaintenanceJobs() {
    return this.maintenanceService.getUrgentJobs();
  }

  @Get('maintenance/:id')
  @ApiOperation({ summary: 'Get maintenance job by ID' })
  @Permissions('maintenance:view')
  async findMaintenanceJobById(@Param('id') id: string) {
    return this.maintenanceService.findJobById(id);
  }

  @Put('maintenance/:id')
  @ApiOperation({ summary: 'Update a maintenance job' })
  @Permissions('maintenance:edit')
  async updateMaintenanceJob(
    @Param('id') id: string,
    @Body() dto: UpdateMaintenanceJobDto,
  ) {
    return this.maintenanceService.updateJob(id, dto);
  }

  @Post('maintenance/:id/schedule')
  @ApiOperation({ summary: 'Schedule a maintenance job' })
  @Permissions('maintenance:edit')
  async scheduleMaintenanceJob(
    @Param('id') id: string,
    @Body('scheduledDate') scheduledDate: string,
    @Body('assignedTo') assignedTo: string,
  ) {
    return this.maintenanceService.scheduleJob(id, new Date(scheduledDate), assignedTo);
  }

  @Post('maintenance/:id/start')
  @ApiOperation({ summary: 'Start a maintenance job' })
  @Permissions('maintenance:edit')
  async startMaintenanceJob(@Param('id') id: string) {
    return this.maintenanceService.startJob(id);
  }

  @Post('maintenance/:id/complete')
  @ApiOperation({ summary: 'Complete a maintenance job' })
  @Permissions('maintenance:edit')
  async completeMaintenanceJob(
    @Param('id') id: string,
    @Body('actualCost') actualCost: number,
    @Body('resolutionNotes') resolutionNotes?: string,
  ) {
    return this.maintenanceService.completeJob(id, actualCost, resolutionNotes);
  }

  @Post('maintenance/:id/cancel')
  @ApiOperation({ summary: 'Cancel a maintenance job' })
  @Permissions('maintenance:edit')
  async cancelMaintenanceJob(
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.maintenanceService.cancelJob(id, reason);
  }

  @Delete('maintenance/:id')
  @ApiOperation({ summary: 'Delete a maintenance job' })
  @Permissions('maintenance:delete')
  async deleteMaintenanceJob(@Param('id') id: string) {
    return this.maintenanceService.deleteJob(id);
  }

  // ==========================================================================
  // KPIs & DASHBOARD
  // ==========================================================================

  @Get('kpi/dashboard')
  @ApiOperation({ summary: 'Get dashboard data' })
  @Permissions('properties:view')
  async getDashboardData() {
    return this.kpiService.getDashboardData();
  }

  @Get('kpi/portfolio')
  @ApiOperation({ summary: 'Get portfolio KPIs' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @Permissions('properties:view')
  async getPortfolioKPIs(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.kpiService.calculatePortfolioKPIs({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('kpi/property/:propertyId')
  @ApiOperation({ summary: 'Get property KPIs' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @Permissions('properties:view')
  async getPropertyKPIs(
    @Param('propertyId') propertyId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.kpiService.calculatePropertyKPIs(propertyId, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('kpi/property/:propertyId/history')
  @ApiOperation({ summary: 'Get property KPI history' })
  @ApiQuery({ name: 'months', required: false, type: Number })
  @Permissions('properties:view')
  async getPropertyKPIHistory(
    @Param('propertyId') propertyId: string,
    @Query('months') months?: number,
  ) {
    return this.kpiService.getKPIHistory(propertyId, months ? Number(months) : 12);
  }

  @Get('kpi/property/:propertyId/forecast')
  @ApiOperation({ summary: 'Get property forecast scenarios' })
  @Permissions('properties:view')
  async getPropertyForecast(@Param('propertyId') propertyId: string) {
    return this.kpiService.forecastScenarios(propertyId);
  }

  @Post('kpi/snapshot/:propertyId')
  @ApiOperation({ summary: 'Create KPI snapshot for a property' })
  @Permissions('properties:edit')
  async createPropertyKPISnapshot(@Param('propertyId') propertyId: string) {
    return this.kpiService.createKPISnapshot(propertyId);
  }

  @Post('kpi/snapshot-all')
  @ApiOperation({ summary: 'Create KPI snapshots for all properties' })
  @Permissions('properties:edit')
  async createAllKPISnapshots() {
    return this.kpiService.createAllKPISnapshots();
  }
}
