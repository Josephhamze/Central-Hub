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
exports.InventoryController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const response_interceptor_1 = require("../../common/interceptors/response.interceptor");
let InventoryController = class InventoryController {
    async getOverview() {
        return {
            message: 'Inventory & warehousing module - placeholder',
            module: 'inventory',
            status: 'not_implemented',
            sections: [
                { name: 'Warehouses', status: 'stub' },
                { name: 'Stock Items', status: 'stub' },
                { name: 'Stock Movements', status: 'stub' },
                { name: 'Stock Counts', status: 'stub' },
            ],
        };
    }
    async getWarehouses() {
        return {
            message: 'Warehouses - placeholder',
            module: 'inventory',
            status: 'not_implemented',
            items: [],
            pagination: { page: 1, limit: 20, total: 0 },
        };
    }
    async getItems() {
        return {
            message: 'Stock items - placeholder',
            module: 'inventory',
            status: 'not_implemented',
            items: [],
            pagination: { page: 1, limit: 20, total: 0 },
        };
    }
};
exports.InventoryController = InventoryController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get inventory overview (stub)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Inventory & warehousing overview - placeholder implementation',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Get)('warehouses'),
    (0, swagger_1.ApiOperation)({ summary: 'Get warehouses (stub)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Warehouses - placeholder implementation',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getWarehouses", null);
__decorate([
    (0, common_1.Get)('items'),
    (0, swagger_1.ApiOperation)({ summary: 'Get stock items (stub)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Stock items - placeholder implementation',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getItems", null);
exports.InventoryController = InventoryController = __decorate([
    (0, swagger_1.ApiTags)('Inventory'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.Controller)('inventory'),
    (0, common_1.UseInterceptors)(response_interceptor_1.ResponseInterceptor)
], InventoryController);
//# sourceMappingURL=inventory.controller.js.map