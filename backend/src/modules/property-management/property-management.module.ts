import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { PropertyManagementController } from './property-management.controller';
import { PropertyManagementService } from './property-management.service';
import { TenantService } from './tenant.service';
import { LeaseService } from './lease.service';
import { RentService } from './rent.service';
import { ExpenseService } from './expense.service';
import { UtilityService } from './utility.service';
import { MaintenanceService } from './maintenance.service';
import { PropertyKPIService } from './property-kpi.service';

@Module({
  imports: [PrismaModule],
  controllers: [PropertyManagementController],
  providers: [
    PropertyManagementService,
    TenantService,
    LeaseService,
    RentService,
    ExpenseService,
    UtilityService,
    MaintenanceService,
    PropertyKPIService,
  ],
  exports: [
    PropertyManagementService,
    TenantService,
    LeaseService,
    RentService,
    ExpenseService,
    UtilityService,
    MaintenanceService,
    PropertyKPIService,
  ],
})
export class PropertyManagementModule {}
