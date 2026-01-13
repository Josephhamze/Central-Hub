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
exports.LogisticsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const response_interceptor_1 = require("../../common/interceptors/response.interceptor");
let LogisticsController = class LogisticsController {
    async getOverview() {
        return {
            message: 'Logistics & transport module - placeholder',
            module: 'logistics',
            status: 'not_implemented',
            sections: [
                { name: 'Fleet Management', status: 'stub' },
                { name: 'Shipments', status: 'stub' },
                { name: 'Routes', status: 'stub' },
                { name: 'Drivers', status: 'stub' },
            ],
        };
    }
    async getFleet() {
        return {
            message: 'Fleet management - placeholder',
            module: 'logistics',
            status: 'not_implemented',
            items: [],
            pagination: { page: 1, limit: 20, total: 0 },
        };
    }
    async getShipments() {
        return {
            message: 'Shipments - placeholder',
            module: 'logistics',
            status: 'not_implemented',
            items: [],
            pagination: { page: 1, limit: 20, total: 0 },
        };
    }
};
exports.LogisticsController = LogisticsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get logistics overview (stub)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Logistics & transport overview - placeholder implementation',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LogisticsController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Get)('fleet'),
    (0, swagger_1.ApiOperation)({ summary: 'Get fleet (stub)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Fleet management - placeholder implementation',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LogisticsController.prototype, "getFleet", null);
__decorate([
    (0, common_1.Get)('shipments'),
    (0, swagger_1.ApiOperation)({ summary: 'Get shipments (stub)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Shipments - placeholder implementation',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LogisticsController.prototype, "getShipments", null);
exports.LogisticsController = LogisticsController = __decorate([
    (0, swagger_1.ApiTags)('Logistics'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.Controller)('logistics'),
    (0, common_1.UseInterceptors)(response_interceptor_1.ResponseInterceptor)
], LogisticsController);
//# sourceMappingURL=logistics.controller.js.map