"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const schedule_1 = require("@nestjs/schedule");
const prisma_module_1 = require("./common/prisma/prisma.module");
const cache_module_1 = require("./common/cache/cache.module");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const roles_module_1 = require("./modules/roles/roles.module");
const health_module_1 = require("./modules/health/health.module");
const dashboard_module_1 = require("./modules/dashboard/dashboard.module");
const administration_module_1 = require("./modules/administration/administration.module");
const operations_module_1 = require("./modules/operations/operations.module");
const production_module_1 = require("./modules/production/production.module");
const costing_module_1 = require("./modules/costing/costing.module");
const inventory_module_1 = require("./modules/inventory/inventory.module");
const assets_module_1 = require("./modules/assets/assets.module");
const logistics_module_1 = require("./modules/logistics/logistics.module");
const customers_module_1 = require("./modules/customers/customers.module");
const reporting_module_1 = require("./modules/reporting/reporting.module");
const quotes_module_1 = require("./modules/quotes/quotes.module");
const stockitems_module_1 = require("./modules/stock-items/stockitems.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const invite_codes_module_1 = require("./modules/invite-codes/invite-codes.module");
const companies_module_1 = require("./modules/companies/companies.module");
const warehouses_module_1 = require("./modules/warehouses/warehouses.module");
const projects_module_1 = require("./modules/projects/projects.module");
const contacts_module_1 = require("./modules/contacts/contacts.module");
const routes_module_1 = require("./modules/routes/routes.module");
const toll_stations_module_1 = require("./modules/toll-stations/toll-stations.module");
const route_costing_module_1 = require("./modules/route-costing/route-costing.module");
const toll_payments_module_1 = require("./modules/toll-payments/toll-payments.module");
const maintenance_schedules_module_1 = require("./modules/maintenance-schedules/maintenance-schedules.module");
const work_orders_module_1 = require("./modules/work-orders/work-orders.module");
const spare_parts_module_1 = require("./modules/spare-parts/spare-parts.module");
const depreciation_module_1 = require("./modules/depreciation/depreciation.module");
const excavators_module_1 = require("./modules/quarry-production/excavators/excavators.module");
const trucks_module_1 = require("./modules/quarry-production/trucks/trucks.module");
const crushers_module_1 = require("./modules/quarry-production/crushers/crushers.module");
const pit_locations_module_1 = require("./modules/quarry-production/pit-locations/pit-locations.module");
const material_types_module_1 = require("./modules/quarry-production/material-types/material-types.module");
const product_types_module_1 = require("./modules/quarry-production/product-types/product-types.module");
const stockpile_locations_module_1 = require("./modules/quarry-production/stockpile-locations/stockpile-locations.module");
const excavator_entries_module_1 = require("./modules/quarry-production/excavator-entries/excavator-entries.module");
const hauling_entries_module_1 = require("./modules/quarry-production/hauling-entries/hauling-entries.module");
const crusher_feed_entries_module_1 = require("./modules/quarry-production/crusher-feed-entries/crusher-feed-entries.module");
const crusher_output_entries_module_1 = require("./modules/quarry-production/crusher-output-entries/crusher-output-entries.module");
const stock_levels_module_1 = require("./modules/quarry-production/stock-levels/stock-levels.module");
const dashboard_module_2 = require("./modules/quarry-production/dashboard/dashboard.module");
const jwt_auth_guard_1 = require("./common/guards/jwt-auth.guard");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            schedule_1.ScheduleModule.forRoot(),
            prisma_module_1.PrismaModule,
            cache_module_1.CacheModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            roles_module_1.RolesModule,
            health_module_1.HealthModule,
            dashboard_module_1.DashboardModule,
            administration_module_1.AdministrationModule,
            operations_module_1.OperationsModule,
            production_module_1.ProductionModule,
            costing_module_1.CostingModule,
            inventory_module_1.InventoryModule,
            assets_module_1.AssetsModule,
            logistics_module_1.LogisticsModule,
            customers_module_1.CustomersModule,
            reporting_module_1.ReportingModule,
            quotes_module_1.QuotesModule,
            stockitems_module_1.StockItemsModule,
            notifications_module_1.NotificationsModule,
            invite_codes_module_1.InviteCodesModule,
            companies_module_1.CompaniesModule,
            warehouses_module_1.WarehousesModule,
            projects_module_1.ProjectsModule,
            contacts_module_1.ContactsModule,
            routes_module_1.RoutesModule,
            toll_stations_module_1.TollStationsModule,
            route_costing_module_1.RouteCostingModule,
            toll_payments_module_1.TollPaymentsModule,
            maintenance_schedules_module_1.MaintenanceSchedulesModule,
            work_orders_module_1.WorkOrdersModule,
            spare_parts_module_1.SparePartsModule,
            depreciation_module_1.DepreciationModule,
            excavators_module_1.ExcavatorsModule,
            trucks_module_1.TrucksModule,
            crushers_module_1.CrushersModule,
            pit_locations_module_1.PitLocationsModule,
            material_types_module_1.MaterialTypesModule,
            product_types_module_1.ProductTypesModule,
            stockpile_locations_module_1.StockpileLocationsModule,
            excavator_entries_module_1.ExcavatorEntriesModule,
            hauling_entries_module_1.HaulingEntriesModule,
            crusher_feed_entries_module_1.CrusherFeedEntriesModule,
            crusher_output_entries_module_1.CrusherOutputEntriesModule,
            stock_levels_module_1.StockLevelsModule,
            dashboard_module_2.DashboardModule,
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: jwt_auth_guard_1.JwtAuthGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map