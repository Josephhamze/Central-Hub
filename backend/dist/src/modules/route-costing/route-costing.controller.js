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
exports.CostingCalculatorController = exports.RouteCostingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const route_costing_service_1 = require("./route-costing.service");
const create_cost_profile_dto_1 = require("./dto/create-cost-profile.dto");
const update_cost_profile_dto_1 = require("./dto/update-cost-profile.dto");
const calculate_costing_dto_1 = require("./dto/calculate-costing.dto");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const rbac_guard_1 = require("../../common/guards/rbac.guard");
const response_interceptor_1 = require("../../common/interceptors/response.interceptor");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
let RouteCostingController = class RouteCostingController {
    routeCostingService;
    constructor(routeCostingService) {
        this.routeCostingService = routeCostingService;
    }
    async findAll(vehicleType, page = 1, limit = 20) {
        return this.routeCostingService.findAll(vehicleType, +page, +limit);
    }
    async findOne(id) {
        return this.routeCostingService.findOne(id);
    }
    async create(dto, userId) {
        return this.routeCostingService.create(dto, userId);
    }
    async update(id, dto) {
        return this.routeCostingService.update(id, dto);
    }
    async activate(id) {
        return this.routeCostingService.update(id, { isActive: true });
    }
    async remove(id) {
        return this.routeCostingService.remove(id);
    }
};
exports.RouteCostingController = RouteCostingController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('logistics:costing:view'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all cost profiles' }),
    (0, swagger_1.ApiQuery)({ name: 'vehicleType', enum: client_1.VehicleType, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    __param(0, (0, common_1.Query)('vehicleType')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], RouteCostingController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('logistics:costing:view'),
    (0, swagger_1.ApiOperation)({ summary: 'Get cost profile by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RouteCostingController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('logistics:costing:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new cost profile' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_cost_profile_dto_1.CreateCostProfileDto, String]),
    __metadata("design:returntype", Promise)
], RouteCostingController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('logistics:costing:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a cost profile' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_cost_profile_dto_1.UpdateCostProfileDto]),
    __metadata("design:returntype", Promise)
], RouteCostingController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/activate'),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('logistics:costing:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Activate a cost profile' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RouteCostingController.prototype, "activate", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('logistics:costing:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a cost profile' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RouteCostingController.prototype, "remove", null);
exports.RouteCostingController = RouteCostingController = __decorate([
    (0, swagger_1.ApiTags)('Route Costing'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.Controller)('cost-profiles'),
    (0, common_1.UseInterceptors)(response_interceptor_1.ResponseInterceptor),
    __metadata("design:paramtypes", [route_costing_service_1.RouteCostingService])
], RouteCostingController);
let CostingCalculatorController = class CostingCalculatorController {
    routeCostingService;
    constructor(routeCostingService) {
        this.routeCostingService = routeCostingService;
    }
    async calculate(dto) {
        return this.routeCostingService.calculateCosting(dto);
    }
};
exports.CostingCalculatorController = CostingCalculatorController;
__decorate([
    (0, common_1.Post)('calculate'),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    (0, permissions_decorator_1.Permissions)('logistics:costing:view'),
    (0, swagger_1.ApiOperation)({ summary: 'Calculate route costing' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [calculate_costing_dto_1.CalculateCostingDto]),
    __metadata("design:returntype", Promise)
], CostingCalculatorController.prototype, "calculate", null);
exports.CostingCalculatorController = CostingCalculatorController = __decorate([
    (0, swagger_1.ApiTags)('Route Costing'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.Controller)('costing'),
    (0, common_1.UseInterceptors)(response_interceptor_1.ResponseInterceptor),
    __metadata("design:paramtypes", [route_costing_service_1.RouteCostingService])
], CostingCalculatorController);
//# sourceMappingURL=route-costing.controller.js.map