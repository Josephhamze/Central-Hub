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
exports.OperationsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const response_interceptor_1 = require("../../common/interceptors/response.interceptor");
let OperationsController = class OperationsController {
    async getOverview() {
        return {
            message: 'Operations module - placeholder',
            module: 'operations',
            status: 'not_implemented',
            sections: [
                { name: 'Work Orders', status: 'stub' },
                { name: 'Schedules', status: 'stub' },
                { name: 'Resources', status: 'stub' },
            ],
        };
    }
    async getWorkOrders() {
        return {
            message: 'Work orders - placeholder',
            module: 'operations',
            status: 'not_implemented',
            items: [],
            pagination: { page: 1, limit: 20, total: 0 },
        };
    }
};
exports.OperationsController = OperationsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get operations overview (stub)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Operations overview - placeholder implementation',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OperationsController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Get)('work-orders'),
    (0, swagger_1.ApiOperation)({ summary: 'Get work orders (stub)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Work orders - placeholder implementation',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OperationsController.prototype, "getWorkOrders", null);
exports.OperationsController = OperationsController = __decorate([
    (0, swagger_1.ApiTags)('Operations'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.Controller)('operations'),
    (0, common_1.UseInterceptors)(response_interceptor_1.ResponseInterceptor)
], OperationsController);
//# sourceMappingURL=operations.controller.js.map