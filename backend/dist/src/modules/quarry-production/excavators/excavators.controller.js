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
exports.ExcavatorsController = void 0;
const common_1 = require("@nestjs/common");
const excavators_service_1 = require("./excavators.service");
const create_excavator_dto_1 = require("./dto/create-excavator.dto");
const update_excavator_dto_1 = require("./dto/update-excavator.dto");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const rbac_guard_1 = require("../../../common/guards/rbac.guard");
const permissions_decorator_1 = require("../../../common/decorators/permissions.decorator");
let ExcavatorsController = class ExcavatorsController {
    excavatorsService;
    constructor(excavatorsService) {
        this.excavatorsService = excavatorsService;
    }
    create(createExcavatorDto) {
        return this.excavatorsService.create(createExcavatorDto);
    }
    findAll(page, limit, search, status) {
        return this.excavatorsService.findAll(page, limit, search, status);
    }
    findOne(id) {
        return this.excavatorsService.findOne(id);
    }
    update(id, updateExcavatorDto) {
        return this.excavatorsService.update(id, updateExcavatorDto);
    }
    remove(id) {
        return this.excavatorsService.remove(id);
    }
};
exports.ExcavatorsController = ExcavatorsController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('quarry:equipment:manage'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_excavator_dto_1.CreateExcavatorDto]),
    __metadata("design:returntype", void 0)
], ExcavatorsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('quarry:equipment:view'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String]),
    __metadata("design:returntype", void 0)
], ExcavatorsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('quarry:equipment:view'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ExcavatorsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.Permissions)('quarry:equipment:manage'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_excavator_dto_1.UpdateExcavatorDto]),
    __metadata("design:returntype", void 0)
], ExcavatorsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.Permissions)('quarry:equipment:manage'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ExcavatorsController.prototype, "remove", null);
exports.ExcavatorsController = ExcavatorsController = __decorate([
    (0, common_1.Controller)('api/v1/quarry-production/excavators'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, rbac_guard_1.RbacGuard),
    __metadata("design:paramtypes", [excavators_service_1.ExcavatorsService])
], ExcavatorsController);
//# sourceMappingURL=excavators.controller.js.map