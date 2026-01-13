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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const response_interceptor_1 = require("../../common/interceptors/response.interceptor");
let DashboardController = class DashboardController {
    async getOverview() {
        return {
            message: 'Dashboard module - placeholder',
            module: 'dashboard',
            status: 'not_implemented',
            widgets: [],
            metrics: [],
        };
    }
    async getStats() {
        return {
            message: 'Dashboard statistics - placeholder',
            module: 'dashboard',
            status: 'not_implemented',
            data: {},
        };
    }
};
exports.DashboardController = DashboardController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get dashboard overview (stub)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Dashboard overview - placeholder implementation',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get dashboard statistics (stub)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Dashboard statistics - placeholder implementation',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getStats", null);
exports.DashboardController = DashboardController = __decorate([
    (0, swagger_1.ApiTags)('Dashboard'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.Controller)('dashboard'),
    (0, common_1.UseInterceptors)(response_interceptor_1.ResponseInterceptor)
], DashboardController);
//# sourceMappingURL=dashboard.controller.js.map