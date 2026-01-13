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
exports.ProductionController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const response_interceptor_1 = require("../../common/interceptors/response.interceptor");
let ProductionController = class ProductionController {
    async getOverview() {
        return {
            message: 'Production tracking module - placeholder',
            module: 'production',
            status: 'not_implemented',
            sections: [
                { name: 'Production Lines', status: 'stub' },
                { name: 'Batches', status: 'stub' },
                { name: 'Quality Control', status: 'stub' },
            ],
        };
    }
    async getProductionLines() {
        return {
            message: 'Production lines - placeholder',
            module: 'production',
            status: 'not_implemented',
            items: [],
            pagination: { page: 1, limit: 20, total: 0 },
        };
    }
    async getBatches() {
        return {
            message: 'Production batches - placeholder',
            module: 'production',
            status: 'not_implemented',
            items: [],
            pagination: { page: 1, limit: 20, total: 0 },
        };
    }
};
exports.ProductionController = ProductionController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get production tracking overview (stub)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Production tracking overview - placeholder implementation',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ProductionController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Get)('lines'),
    (0, swagger_1.ApiOperation)({ summary: 'Get production lines (stub)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Production lines - placeholder implementation',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ProductionController.prototype, "getProductionLines", null);
__decorate([
    (0, common_1.Get)('batches'),
    (0, swagger_1.ApiOperation)({ summary: 'Get production batches (stub)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Production batches - placeholder implementation',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ProductionController.prototype, "getBatches", null);
exports.ProductionController = ProductionController = __decorate([
    (0, swagger_1.ApiTags)('Production'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.Controller)('production'),
    (0, common_1.UseInterceptors)(response_interceptor_1.ResponseInterceptor)
], ProductionController);
//# sourceMappingURL=production.controller.js.map