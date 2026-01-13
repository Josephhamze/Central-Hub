import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';

// Core modules
import { PrismaModule } from './common/prisma/prisma.module';
import { CacheModule } from './common/cache/cache.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { HealthModule } from './modules/health/health.module';

// Placeholder modules
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AdministrationModule } from './modules/administration/administration.module';
import { OperationsModule } from './modules/operations/operations.module';
import { ProductionModule } from './modules/production/production.module';
import { CostingModule } from './modules/costing/costing.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { AssetsModule } from './modules/assets/assets.module';
import { LogisticsModule } from './modules/logistics/logistics.module';
import { CustomersModule } from './modules/customers/customers.module';
import { ReportingModule } from './modules/reporting/reporting.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { StockItemsModule } from './modules/stock-items/stockitems.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { InviteCodesModule } from './modules/invite-codes/invite-codes.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { WarehousesModule } from './modules/warehouses/warehouses.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { RoutesModule } from './modules/routes/routes.module';
import { TollStationsModule } from './modules/toll-stations/toll-stations.module';
import { RouteCostingModule } from './modules/route-costing/route-costing.module';
import { TollPaymentsModule } from './modules/toll-payments/toll-payments.module';
import { MaintenanceSchedulesModule } from './modules/maintenance-schedules/maintenance-schedules.module';
import { WorkOrdersModule } from './modules/work-orders/work-orders.module';
import { SparePartsModule } from './modules/spare-parts/spare-parts.module';
import { DepreciationModule } from './modules/depreciation/depreciation.module';

// Quarry Production modules
import { ExcavatorsModule } from './modules/quarry-production/excavators/excavators.module';
import { TrucksModule } from './modules/quarry-production/trucks/trucks.module';
import { CrushersModule } from './modules/quarry-production/crushers/crushers.module';
import { PitLocationsModule } from './modules/quarry-production/pit-locations/pit-locations.module';
import { MaterialTypesModule } from './modules/quarry-production/material-types/material-types.module';
import { ProductTypesModule } from './modules/quarry-production/product-types/product-types.module';
import { StockpileLocationsModule } from './modules/quarry-production/stockpile-locations/stockpile-locations.module';
import { ExcavatorEntriesModule } from './modules/quarry-production/excavator-entries/excavator-entries.module';
import { HaulingEntriesModule } from './modules/quarry-production/hauling-entries/hauling-entries.module';
import { CrusherFeedEntriesModule } from './modules/quarry-production/crusher-feed-entries/crusher-feed-entries.module';
import { CrusherOutputEntriesModule } from './modules/quarry-production/crusher-output-entries/crusher-output-entries.module';
import { StockLevelsModule } from './modules/quarry-production/stock-levels/stock-levels.module';
import { DashboardModule as QuarryDashboardModule } from './modules/quarry-production/dashboard/dashboard.module';

// Guards
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Scheduled tasks
    ScheduleModule.forRoot(),

    // Core
    PrismaModule,
    CacheModule, // Optional caching (in-memory by default, Redis if configured)
    AuthModule,
    UsersModule,
    RolesModule,
    HealthModule,

    // Placeholder modules
    DashboardModule,
    AdministrationModule,
    OperationsModule,
    ProductionModule,
    CostingModule,
    InventoryModule,
    AssetsModule,
    LogisticsModule,
    CustomersModule,
    ReportingModule,
    QuotesModule,
    StockItemsModule,
    NotificationsModule,
    InviteCodesModule,
    CompaniesModule,
    WarehousesModule,
    ProjectsModule,
    ContactsModule,
    RoutesModule,
    TollStationsModule,
    RouteCostingModule,
    TollPaymentsModule,
    MaintenanceSchedulesModule,
    WorkOrdersModule,
    SparePartsModule,
    DepreciationModule,
    // Quarry Production modules
    ExcavatorsModule,
    TrucksModule,
    CrushersModule,
    PitLocationsModule,
    MaterialTypesModule,
    ProductTypesModule,
    StockpileLocationsModule,
    ExcavatorEntriesModule,
    HaulingEntriesModule,
    CrusherFeedEntriesModule,
    CrusherOutputEntriesModule,
    StockLevelsModule,
    QuarryDashboardModule,
  ],
  providers: [
    // Global JWT guard - all routes protected by default
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}


