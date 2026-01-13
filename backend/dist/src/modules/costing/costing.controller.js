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
exports.CostingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const response_interceptor_1 = require("../../common/interceptors/response.interceptor");
let CostingController = class CostingController {
    async getOverview() {
        return {
            message: 'Costing module - placeholder',
            module: 'costing',
            status: 'not_implemented',
            sections: [
                { name: 'Cost Centers', status: 'stub' },
                { name: 'Cost Items', status: 'stub' },
                { name: 'Cost Analysis', status: 'stub' },
            ],
        };
    }
    async getCostCenters() {
        return {
            message: 'Cost centers - placeholder',
            module: 'costing',
            status: 'not_implemented',
            items: [],
            pagination: { page: 1, limit: 20, total: 0 },
        };
    }
};
exports.CostingController = CostingController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get costing overview (stub)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Costing overview - placeholder implementation',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CostingController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Get)('centers'),
    (0, swagger_1.ApiOperation)({ summary: 'Get cost centers (stub)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Cost centers - placeholder implementation',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CostingController.prototype, "getCostCenters", null);
exports.CostingController = CostingController = __decorate([
    (0, swagger_1.ApiTags)('Costing'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.Controller)('costing'),
    (0, common_1.UseInterceptors)(response_interceptor_1.ResponseInterceptor)
], CostingController);
//# sourceMappingURL=costing.controller.js.map