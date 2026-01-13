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
exports.SparePartsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const spare_parts_service_1 = require("./spare-parts.service");
const create_spare_part_dto_1 = require("./dto/create-spare-part.dto");
const update_spare_part_dto_1 = require("./dto/update-spare-part.dto");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const rbac_guard_1 = require("../../common/guards/rbac.guard");
const response_interceptor_1 = require("../../common/interceptors/response.interceptor");
let SparePartsController = class SparePartsController {
    sparePartsService;
    constructor(sparePartsService) {
        this.sparePartsService = sparePartsService;
    }
    async findAll(page = 1, limit = 20, search, warehouseId) {
        return this.sparePartsService.findAll(page, limit, search, warehouseId);
    }
    async getLowStock() {
        return this.sparePartsService.getLowStock();
    }
    async findOne(id) {
        return this.sparePartsService.findOne(id);
    }
    async create(dto) {
        return this.sparePartsService.create(dto);
    }
    async update(id, dto) {
        return this.sparePartsService.update(id, dto);
    }
    async remove(id) {
        return this.sparePartsService.remove(id);
    }
};
exports.SparePartsController = SparePartsController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('parts:view'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all spare parts' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'warehouseId', required: false, type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of spare parts' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('warehouseId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], SparePartsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('low-stock'),
    (0, permissions_decorator_1.Permissions)('parts:view'),
    (0, swagger_1.ApiOperation)({ summary: 'Get spare parts with low stock' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of low stock parts' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SparePartsController.prototype, "getLowStock", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('parts:view'),
    (0, swagger_1.ApiOperation)({ summary: 'Get spare part by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Spare part details' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Spare part not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SparePartsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('parts:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new spare part' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Spare part created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input or SKU already exists' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_spare_part_dto_1.CreateSparePartDto]),
    __metadata("design:returntype", Promise)
], SparePartsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, permissions_decorator_1.Permissions)('parts:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a spare part' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Spare part updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Spare part not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_spare_part_dto_1.UpdateSparePartDto]),
    __metadata("design:returntype", Promise)
], SparePartsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.Permissions)('parts:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a spare part' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Spare part deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Spare part not found' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Cannot delete part with usage history' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SparePartsController.prototype, "remove", null);
exports.SparePartsController = SparePartsController = __decorate([
    (0, swagger_1.ApiTags)('Spare Parts'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.Controller)('spare-parts'),
    (0, common_1.UseInterceptors)(response_interceptor_1.ResponseInterceptor),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    __metadata("design:paramtypes", [spare_parts_service_1.SparePartsService])
], SparePartsController);
//# sourceMappingURL=spare-parts.controller.js.map