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
exports.ReportingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const response_interceptor_1 = require("../../common/interceptors/response.interceptor");
let ReportingController = class ReportingController {
    async getOverview() {
        return {
            message: 'Reporting & analytics module - placeholder',
            module: 'reporting',
            status: 'not_implemented',
            sections: [
                { name: 'Report Builder', status: 'stub' },
                { name: 'Dashboards', status: 'stub' },
                { name: 'Scheduled Reports', status: 'stub' },
                { name: 'Data Export', status: 'stub' },
            ],
        };
    }
    async getTemplates() {
        return {
            message: 'Report templates - placeholder',
            module: 'reporting',
            status: 'not_implemented',
            items: [],
        };
    }
    async getDashboards() {
        return {
            message: 'Dashboards - placeholder',
            module: 'reporting',
            status: 'not_implemented',
            items: [],
        };
    }
};
exports.ReportingController = ReportingController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get reporting overview (stub)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Reporting & analytics overview - placeholder implementation',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Get)('templates'),
    (0, swagger_1.ApiOperation)({ summary: 'Get report templates (stub)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Report templates - placeholder implementation',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "getTemplates", null);
__decorate([
    (0, common_1.Get)('dashboards'),
    (0, swagger_1.ApiOperation)({ summary: 'Get dashboards (stub)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Dashboards - placeholder implementation',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "getDashboards", null);
exports.ReportingController = ReportingController = __decorate([
    (0, swagger_1.ApiTags)('Reporting'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.Controller)('reporting'),
    (0, common_1.UseInterceptors)(response_interceptor_1.ResponseInterceptor)
], ReportingController);
//# sourceMappingURL=reporting.controller.js.map