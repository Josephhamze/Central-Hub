"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const common_1 = require("@nestjs/common");
const dashboard_service_1 = require("./dashboard.service");
const variance_query_dto_1 = require("./dto/variance-query.dto");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const rbac_guard_1 = require("../../../common/guards/rbac.guard");
const permissions_decorator_1 = require("../../../common/decorators/permissions.decorator");
let DashboardController = class DashboardController {
    dashboardService;
    constructor(dashboardService) {
        this.dashboardService = dashboardService;
    }
    getVarianceAnalysis(query) {
        return this.dashboardService.getVarianceAnalysis(new Date(query.date), query.shift);
    }
    getKPIs(dateFrom, dateTo) {
        return this.dashboardService.getKPIs(new Date(dateFrom), new Date(dateTo));
    }
    getDailySummary(date) {
        return this.dashboardService.getDailySummary(new Date(date));
    }
    getWeeklySummary(startDate) {
        return this.dashboardService.getWeeklySummary(new Date(startDate));
    }
};
exports.DashboardController = DashboardController;
__decorate([
    (0, common_1.Get)('variance'),
    (0, permissions_decorator_1.Permissions)('quarry:dashboard:view'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [variance_query_dto_1.VarianceQueryDto]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getVarianceAnalysis", null);
__decorate([
    (0, common_1.Get)('kpis'),
    (0, permissions_decorator_1.Permissions)('quarry:dashboard:view'),
    __param(0, (0, common_1.Query)('dateFrom')),
    __param(1, (0, common_1.Query)('dateTo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getKPIs", null);
__decorate([
    (0, common_1.Get)('daily-summary'),
    (0, permissions_decorator_1.Permissions)('quarry:dashboard:view'),
    __param(0, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getDailySummary", null);
__decorate([
    (0, common_1.Get)('weekly-summary'),
    (0, permissions_decorator_1.Permissions)('quarry:dashboard:view'),
    __param(0, (0, common_1.Query)('startDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getWeeklySummary", null);
exports.DashboardController = DashboardController = __decorate([
    (0, common_1.Controller)('api/v1/quarry-production/dashboard'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, rbac_guard_1.RbacGuard),
    __metadata("design:paramtypes", [dashboard_service_1.DashboardService])
], DashboardController);
//# sourceMappingURL=dashboard.controller.js.map