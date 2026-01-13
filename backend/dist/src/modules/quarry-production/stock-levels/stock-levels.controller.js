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
exports.StockLevelsController = void 0;
const common_1 = require("@nestjs/common");
const stock_levels_service_1 = require("./stock-levels.service");
const create_stock_level_dto_1 = require("./dto/create-stock-level.dto");
const update_stock_level_dto_1 = require("./dto/update-stock-level.dto");
const adjust_stock_dto_1 = require("./dto/adjust-stock.dto");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const rbac_guard_1 = require("../../../common/guards/rbac.guard");
const permissions_decorator_1 = require("../../../common/decorators/permissions.decorator");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
let StockLevelsController = class StockLevelsController {
    stockLevelsService;
    constructor(stockLevelsService) {
        this.stockLevelsService = stockLevelsService;
    }
    create(createDto, userId) {
        return this.stockLevelsService.createOrUpdate(createDto, userId);
    }
    findAll(page, limit, dateFrom, dateTo, productTypeId, stockpileLocationId) {
        return this.stockLevelsService.findAll(page, limit, dateFrom, dateTo, productTypeId, stockpileLocationId);
    }
    getCurrentStock(productTypeId, stockpileLocationId) {
        return this.stockLevelsService.getCurrentStock(productTypeId, stockpileLocationId);
    }
    findOne(id) {
        return this.stockLevelsService.findOne(id);
    }
    update(id, updateDto, userId) {
        return this.stockLevelsService.createOrUpdate(updateDto, userId);
    }
    adjustStock(id, adjustDto, userId) {
        return this.stockLevelsService.adjustStock(id, adjustDto, userId);
    }
    recalculateStock(body) {
        return this.stockLevelsService.recalculateStock(new Date(body.date), body.productTypeId, body.stockpileLocationId);
    }
};
exports.StockLevelsController = StockLevelsController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('quarry:stock:view'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_stock_level_dto_1.CreateStockLevelDto, String]),
    __metadata("design:returntype", void 0)
], StockLevelsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('quarry:stock:view'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('dateFrom')),
    __param(3, (0, common_1.Query)('dateTo')),
    __param(4, (0, common_1.Query)('productTypeId')),
    __param(5, (0, common_1.Query)('stockpileLocationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String, String, String]),
    __metadata("design:returntype", void 0)
], StockLevelsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('current'),
    (0, permissions_decorator_1.Permissions)('quarry:stock:view'),
    __param(0, (0, common_1.Query)('productTypeId')),
    __param(1, (0, common_1.Query)('stockpileLocationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], StockLevelsController.prototype, "getCurrentStock", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('quarry:stock:view'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StockLevelsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.Permissions)('quarry:stock:view'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_stock_level_dto_1.UpdateStockLevelDto, String]),
    __metadata("design:returntype", void 0)
], StockLevelsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/adjust'),
    (0, permissions_decorator_1.Permissions)('quarry:stock:adjust'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, adjust_stock_dto_1.AdjustStockDto, String]),
    __metadata("design:returntype", void 0)
], StockLevelsController.prototype, "adjustStock", null);
__decorate([
    (0, common_1.Post)('recalculate'),
    (0, permissions_decorator_1.Permissions)('quarry:stock:view'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StockLevelsController.prototype, "recalculateStock", null);
exports.StockLevelsController = StockLevelsController = __decorate([
    (0, common_1.Controller)('api/v1/quarry-production/stock-levels'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, rbac_guard_1.RbacGuard),
    __metadata("design:paramtypes", [stock_levels_service_1.StockLevelsService])
], StockLevelsController);
//# sourceMappingURL=stock-levels.controller.js.map