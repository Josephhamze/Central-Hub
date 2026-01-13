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
exports.MaterialTypesController = void 0;
const common_1 = require("@nestjs/common");
const material_types_service_1 = require("./material-types.service");
const create_material_type_dto_1 = require("./dto/create-material-type.dto");
const update_material_type_dto_1 = require("./dto/update-material-type.dto");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const rbac_guard_1 = require("../../../common/guards/rbac.guard");
const permissions_decorator_1 = require("../../../common/decorators/permissions.decorator");
let MaterialTypesController = class MaterialTypesController {
    materialTypesService;
    constructor(materialTypesService) {
        this.materialTypesService = materialTypesService;
    }
    create(createMaterialTypeDto) {
        return this.materialTypesService.create(createMaterialTypeDto);
    }
    findAll(page, limit, search, isActive) {
        const isActiveBool = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
        return this.materialTypesService.findAll(page, limit, search, isActiveBool);
    }
    findOne(id) {
        return this.materialTypesService.findOne(id);
    }
    update(id, updateMaterialTypeDto) {
        return this.materialTypesService.update(id, updateMaterialTypeDto);
    }
    remove(id) {
        return this.materialTypesService.remove(id);
    }
};
exports.MaterialTypesController = MaterialTypesController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('quarry:settings:manage'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_material_type_dto_1.CreateMaterialTypeDto]),
    __metadata("design:returntype", void 0)
], MaterialTypesController.prototype, "create", null);
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
], MaterialTypesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('quarry:settings:view'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MaterialTypesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.Permissions)('quarry:settings:manage'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_material_type_dto_1.UpdateMaterialTypeDto]),
    __metadata("design:returntype", void 0)
], MaterialTypesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.Permissions)('quarry:settings:manage'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MaterialTypesController.prototype, "remove", null);
exports.MaterialTypesController = MaterialTypesController = __decorate([
    (0, common_1.Controller)('api/v1/quarry-production/material-types'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, rbac_guard_1.RbacGuard),
    __metadata("design:paramtypes", [material_types_service_1.MaterialTypesService])
], MaterialTypesController);
//# sourceMappingURL=material-types.controller.js.map