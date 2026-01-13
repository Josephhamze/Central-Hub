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
exports.StockpileLocationsController = void 0;
const common_1 = require("@nestjs/common");
const stockpile_locations_service_1 = require("./stockpile-locations.service");
const create_stockpile_location_dto_1 = require("./dto/create-stockpile-location.dto");
const update_stockpile_location_dto_1 = require("./dto/update-stockpile-location.dto");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const rbac_guard_1 = require("../../../common/guards/rbac.guard");
const permissions_decorator_1 = require("../../../common/decorators/permissions.decorator");
let StockpileLocationsController = class StockpileLocationsController {
    stockpileLocationsService;
    constructor(stockpileLocationsService) {
        this.stockpileLocationsService = stockpileLocationsService;
    }
    create(createDto) {
        return this.stockpileLocationsService.create(createDto);
    }
    findAll(page, limit, search, isActive) {
        const isActiveBool = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
        return this.stockpileLocationsService.findAll(page, limit, search, isActiveBool);
    }
    findOne(id) {
        return this.stockpileLocationsService.findOne(id);
    }
    update(id, updateDto) {
        return this.stockpileLocationsService.update(id, updateDto);
    }
    remove(id) {
        return this.stockpileLocationsService.remove(id);
    }
};
exports.StockpileLocationsController = StockpileLocationsController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('quarry:settings:manage'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_stockpile_location_dto_1.CreateStockpileLocationDto]),
    __metadata("design:returntype", void 0)
], StockpileLocationsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('quarry:settings:view'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('isActive')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String]),
    __metadata("design:returntype", void 0)
], StockpileLocationsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('quarry:settings:view'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StockpileLocationsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.Permissions)('quarry:settings:manage'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_stockpile_location_dto_1.UpdateStockpileLocationDto]),
    __metadata("design:returntype", void 0)
], StockpileLocationsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.Permissions)('quarry:settings:manage'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StockpileLocationsController.prototype, "remove", null);
exports.StockpileLocationsController = StockpileLocationsController = __decorate([
    (0, common_1.Controller)('api/v1/quarry-production/stockpile-locations'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, rbac_guard_1.RbacGuard),
    __metadata("design:paramtypes", [stockpile_locations_service_1.StockpileLocationsService])
], StockpileLocationsController);
//# sourceMappingURL=stockpile-locations.controller.js.map