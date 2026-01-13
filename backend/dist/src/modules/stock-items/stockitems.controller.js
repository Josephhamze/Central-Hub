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
exports.StockItemsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const swagger_2 = require("@nestjs/swagger");
const common_2 = require("@nestjs/common");
const stockitems_service_1 = require("./stockitems.service");
const create_stock_item_dto_1 = require("./dto/create-stock-item.dto");
const update_stock_item_dto_1 = require("./dto/update-stock-item.dto");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const rbac_guard_1 = require("../../common/guards/rbac.guard");
const response_interceptor_1 = require("../../common/interceptors/response.interceptor");
let StockItemsController = class StockItemsController {
    stockItemsService;
    constructor(stockItemsService) {
        this.stockItemsService = stockItemsService;
    }
    async findAll(companyId, projectId, warehouseId, page = 1, limit = 20, search) {
        return this.stockItemsService.findAll(companyId, projectId, warehouseId, +page, +limit, search);
    }
    async findOne(id) {
        return this.stockItemsService.findOne(id);
    }
    async create(dto) {
        return this.stockItemsService.create(dto);
    }
    async update(id, dto) {
        return this.stockItemsService.update(id, dto);
    }
    async bulkImport(file) {
        if (!file) {
            throw new common_2.BadRequestException('No file uploaded');
        }
        if (!file.mimetype.includes('spreadsheet') && !file.mimetype.includes('excel') && !file.originalname.endsWith('.xlsx') && !file.originalname.endsWith('.xls')) {
            throw new common_2.BadRequestException('File must be an Excel file (.xlsx or .xls)');
        }
        return this.stockItemsService.bulkImport(file);
    }
    async remove(id) {
        return this.stockItemsService.remove(id);
    }
};
exports.StockItemsController = StockItemsController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('stock:view'),
    (0, swagger_2.ApiOperation)({ summary: 'Get all stock items' }),
    __param(0, (0, common_1.Query)('companyId')),
    __param(1, (0, common_1.Query)('projectId')),
    __param(2, (0, common_1.Query)('warehouseId')),
    __param(3, (0, common_1.Query)('page')),
    __param(4, (0, common_1.Query)('limit')),
    __param(5, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object, Object, String]),
    __metadata("design:returntype", Promise)
], StockItemsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('stock:view'),
    (0, swagger_2.ApiOperation)({ summary: 'Get stock item by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StockItemsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('stock:create'),
    (0, swagger_2.ApiOperation)({ summary: 'Create a new stock item' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_stock_item_dto_1.CreateStockItemDto]),
    __metadata("design:returntype", Promise)
], StockItemsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('stock:update'),
    (0, swagger_2.ApiOperation)({ summary: 'Update a stock item' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_stock_item_dto_1.UpdateStockItemDto]),
    __metadata("design:returntype", Promise)
], StockItemsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)('bulk-import'),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('stock:create'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    }),
    (0, swagger_2.ApiOperation)({ summary: 'Bulk import stock items from Excel file' }),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StockItemsController.prototype, "bulkImport", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('stock:delete'),
    (0, swagger_2.ApiOperation)({ summary: 'Delete a stock item' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StockItemsController.prototype, "remove", null);
exports.StockItemsController = StockItemsController = __decorate([
    (0, swagger_2.ApiTags)('Stock Items'),
    (0, swagger_2.ApiBearerAuth)('JWT-auth'),
    (0, common_1.Controller)('stock-items'),
    (0, common_1.UseInterceptors)(response_interceptor_1.ResponseInterceptor),
    __metadata("design:paramtypes", [stockitems_service_1.StockItemsService])
], StockItemsController);
//# sourceMappingURL=stockitems.controller.js.map