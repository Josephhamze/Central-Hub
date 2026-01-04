import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

// Core modules
import { PrismaModule } from './common/prisma/prisma.module';
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

// Guards
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Core
    PrismaModule,
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


