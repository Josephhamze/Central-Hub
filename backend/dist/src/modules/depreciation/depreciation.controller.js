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
exports.DepreciationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const depreciation_service_1 = require("./depreciation.service");
const create_profile_dto_1 = require("./dto/create-profile.dto");
const run_monthly_dto_1 = require("./dto/run-monthly.dto");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const rbac_guard_1 = require("../../common/guards/rbac.guard");
const response_interceptor_1 = require("../../common/interceptors/response.interceptor");
let DepreciationController = class DepreciationController {
    depreciationService;
    constructor(depreciationService) {
        this.depreciationService = depreciationService;
    }
    async findAll(page = 1, limit = 20) {
        return this.depreciationService.findAll(page, limit);
    }
    async findOne(assetId) {
        return this.depreciationService.findOne(assetId);
    }
    async createProfile(dto) {
        return this.depreciationService.createProfile(dto);
    }
    async runMonthly(dto, userId) {
        return this.depreciationService.runMonthly(dto, userId);
    }
    async postEntry(assetId, period, userId) {
        return this.depreciationService.postEntry(assetId, period, userId);
    }
    async postAllForPeriod(period, userId) {
        return this.depreciationService.postAllForPeriod(period, userId);
    }
};
exports.DepreciationController = DepreciationController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('depreciation:view'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all depreciation profiles' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of depreciation profiles' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], DepreciationController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('assets/:assetId'),
    (0, permissions_decorator_1.Permissions)('depreciation:view'),
    (0, swagger_1.ApiOperation)({ summary: 'Get depreciation profile for an asset' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Depreciation profile' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Profile not found' }),
    __param(0, (0, common_1.Param)('assetId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DepreciationController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)('profiles'),
    (0, permissions_decorator_1.Permissions)('depreciation:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a depreciation profile' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Profile created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input or profile already exists' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_profile_dto_1.CreateDepreciationProfileDto]),
    __metadata("design:returntype", Promise)
], DepreciationController.prototype, "createProfile", null);
__decorate([
    (0, common_1.Post)('run-monthly'),
    (0, permissions_decorator_1.Permissions)('depreciation:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Run monthly depreciation calculation' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Monthly depreciation calculated' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [run_monthly_dto_1.RunMonthlyDepreciationDto, String]),
    __metadata("design:returntype", Promise)
], DepreciationController.prototype, "runMonthly", null);
__decorate([
    (0, common_1.Post)('post/:assetId/:period'),
    (0, permissions_decorator_1.Permissions)('depreciation:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Post a depreciation entry' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Entry posted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Entry not found' }),
    __param(0, (0, common_1.Param)('assetId')),
    __param(1, (0, common_1.Param)('period')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], DepreciationController.prototype, "postEntry", null);
__decorate([
    (0, common_1.Post)('post-period/:period'),
    (0, permissions_decorator_1.Permissions)('depreciation:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Post all entries for a period' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Entries posted' }),
    __param(0, (0, common_1.Param)('period')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DepreciationController.prototype, "postAllForPeriod", null);
exports.DepreciationController = DepreciationController = __decorate([
    (0, swagger_1.ApiTags)('Depreciation'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.Controller)('depreciation'),
    (0, common_1.UseInterceptors)(response_interceptor_1.ResponseInterceptor),
    (0, common_1.UseGuards)(rbac_guard_1.RbacGuard),
    __metadata("design:paramtypes", [depreciation_service_1.DepreciationService])
], DepreciationController);
//# sourceMappingURL=depreciation.controller.js.map